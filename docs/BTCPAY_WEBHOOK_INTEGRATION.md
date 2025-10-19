# BTCPay Server Webhook Integration Guide

## Overview

BeautyCita now supports Bitcoin and Lightning Network payments through BTCPay Server with automated webhook notifications for booking confirmations.

## Architecture

### Components
- **BTCPay Server**: Self-hosted Bitcoin/Lightning payment processor
- **Webhook Endpoint**: `/api/webhooks/btcpay`
- **Database**: Enhanced `payments` table with BTCPay tracking
- **Notifications**: Twilio SMS integration for instant alerts

### Payment Flow

```
1. Client books service
   ↓
2. Create BTCPay invoice with booking metadata
   ↓
3. Client pays with Bitcoin/Lightning
   ↓
4. BTCPay sends webhook → BeautyCita
   ↓
5. Webhook validates signature
   ↓
6. Update payment & booking status
   ↓
7. Send SMS to client & stylist
   ↓
8. Create notifications in app
```

## Webhook Events

### InvoiceProcessing
- **Trigger**: Payment detected (0 confirmations)
- **Action**:
  - Update payment status to `PROCESSING`
  - Send SMS to client: "Payment detected, confirming..."

### InvoiceSettled
- **Trigger**: Payment confirmed (1+ confirmations)
- **Action**:
  - Update payment status to `SUCCEEDED`
  - Update booking status to `CONFIRMED`
  - Send SMS to client: "✅ Payment confirmed! Booking confirmed."
  - Send SMS to stylist: "🎉 New booking confirmed! Payment received."
  - Create in-app notifications

### InvoiceExpired
- **Trigger**: Invoice expired without payment
- **Action**:
  - Update payment status to `FAILED`
  - Cancel booking (if still pending)

### InvoiceInvalid
- **Trigger**: Payment issue detected
- **Action**:
  - Update payment status to `FAILED`

## Database Schema

### Payments Table Additions
```sql
ALTER TABLE payments
ADD COLUMN btcpay_invoice_id VARCHAR(255),
ADD COLUMN btcpay_store_id VARCHAR(255),
ADD COLUMN btc_amount DECIMAL(16,8),
ADD COLUMN btc_usd_rate DECIMAL(12,2),
ADD COLUMN lightning_invoice TEXT;

CREATE INDEX idx_payments_btcpay_invoice ON payments(btcpay_invoice_id);
```

## Security

### Webhook Signature Validation
- Uses HMAC-SHA256 signature verification
- Signature in header: `btcpay-sig`
- Secret configured via: `BTCPAY_WEBHOOK_SECRET` environment variable

```javascript
// Validation process
const signature = req.headers['btcpay-sig'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', BTCPAY_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
```

## Configuration

### Environment Variables Required

```bash
# BTCPay Server
BTCPAY_URL=https://beautycita.com/btcpay
BTCPAY_API_KEY=<your_api_key>
BTCPAY_STORE_ID=<your_store_id>
BTCPAY_WEBHOOK_SECRET=<your_webhook_secret>

# Twilio (already configured)
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=<number>
```

### BTCPay Server Setup

1. **Login to BTCPay Dashboard**: https://beautycita.com/btcpay/

2. **Create Store** (if not exists)

3. **Generate API Key**:
   - Go to Account → API Keys
   - Create new key with permissions:
     - `btcpay.store.canviewinvoices`
     - `btcpay.store.cancreateinvoice`
   - Copy the API key to `.env`

4. **Configure Webhook**:
   - Go to Store → Webhooks
   - Click "Create Webhook"
   - Payload URL: `https://beautycita.com/api/webhooks/btcpay`
   - Secret: Generate strong random string, save to `.env` as `BTCPAY_WEBHOOK_SECRET`
   - Enable events:
     - `InvoiceReceivedPayment`
     - `InvoiceProcessing`
     - `InvoiceSettled`
     - `InvoicePaymentSettled`
     - `InvoiceExpired`
     - `InvoiceInvalid`

5. **Test Webhook**:
   - Click "Redeliver" on test event
   - Check backend logs: `pm2 logs beautycita-api`

## API Usage

### Creating a Booking with Bitcoin Payment

```javascript
// 1. Create booking
POST /api/bookings
{
  "stylist_id": 123,
  "service_id": 456,
  "booking_date": "2025-10-15",
  "booking_time": "14:00",
  "payment_method": "bitcoin"
}

// Response includes BTCPay invoice
{
  "success": true,
  "booking_id": 789,
  "payment": {
    "btcpay_invoice_id": "inv_xyz123",
    "checkout_url": "https://beautycita.com/btcpay/invoice/inv_xyz123",
    "amount_btc": 0.00123456,
    "amount_usd": 50.00
  }
}

// 2. Client opens checkout_url and pays

// 3. Webhook automatically:
//    - Confirms payment
//    - Updates booking status
//    - Sends SMS notifications
//    - Creates in-app notifications
```

### Webhook Payload Example

```json
{
  "type": "InvoiceSettled",
  "invoiceId": "inv_xyz123",
  "storeId": "store_abc",
  "metadata": {
    "bookingId": 789,
    "userId": 456
  },
  "payment": {
    "id": "txid_or_lightning_hash",
    "value": 0.00123456,
    "confirmations": 3,
    "paymentMethod": "BTC"
  }
}
```

## SMS Notifications

### Client Notifications

**Payment Detected**:
```
BeautyCita: Your Bitcoin payment has been detected and is confirming.
You'll receive another message once confirmed. Booking #789
```

**Payment Confirmed**:
```
BeautyCita: ✅ Payment confirmed! Your booking on 10/15/2025 at 2:00 PM
with Sofia's Beauty Studio is confirmed. Booking #789
```

### Stylist Notifications

**New Booking**:
```
BeautyCita: 🎉 New booking confirmed! Maria Lopez on 10/15/2025 at 2:00 PM.
Payment: $50.00 (Bitcoin). Booking #789
```

## Monitoring

### Check Webhook Events
```sql
SELECT
  id,
  event_type,
  invoice_id,
  processed,
  error,
  created_at
FROM btcpay_webhook_events
ORDER BY created_at DESC
LIMIT 20;
```

### Check Payment Status
```sql
SELECT
  p.id,
  p.booking_id,
  p.btcpay_invoice_id,
  p.amount,
  p.btc_amount,
  p.status,
  p.processed_at,
  b.status as booking_status
FROM payments p
JOIN bookings b ON p.booking_id = b.id
WHERE p.btcpay_invoice_id IS NOT NULL
ORDER BY p.created_at DESC;
```

### Backend Logs
```bash
# View webhook activity
pm2 logs beautycita-api | grep "BTCPay"

# View all logs
pm2 logs beautycita-api
```

## Testing

### Manual Webhook Test
```bash
# Test endpoint accessibility
curl -X POST https://beautycita.com/api/webhooks/btcpay \
  -H "Content-Type: application/json" \
  -d '{
    "type": "InvoiceSettled",
    "invoiceId": "test_123",
    "storeId": "test_store",
    "metadata": {
      "bookingId": 1
    }
  }'
```

### Create Test Payment
```bash
# Use BTCPay's test invoice feature
# Or use Bitcoin testnet/regtest
```

## Troubleshooting

### Webhook Not Receiving Events

1. **Check BTCPay webhook configuration**:
   - URL correct: `https://beautycita.com/api/webhooks/btcpay`
   - Events enabled
   - Webhook active

2. **Check backend logs**:
   ```bash
   pm2 logs beautycita-api --lines 50
   ```

3. **Test webhook manually**:
   - Use BTCPay's "Redeliver" button
   - Check response in BTCPay logs

### Signature Validation Failing

1. **Verify secret matches**:
   - BTCPay webhook secret
   - `.env` BTCPAY_WEBHOOK_SECRET

2. **Check header name**: Must be `btcpay-sig`

### Payment Not Updating

1. **Check database permissions**:
   ```sql
   GRANT SELECT, INSERT, UPDATE ON payments TO beautycita_app;
   GRANT SELECT, UPDATE ON bookings TO beautycita_app;
   ```

2. **Verify metadata in invoice**:
   - Must include `bookingId`
   - Must match existing booking

### SMS Not Sending

1. **Check Twilio credentials** in `.env`
2. **Verify phone numbers** in E.164 format (+1234567890)
3. **Check SMS preferences** for users

## File Locations

- **Webhook Handler**: `/var/www/beautycita.com/backend/src/routes/btcpay-webhooks.js`
- **Server Config**: `/var/www/beautycita.com/backend/src/server.js` (line 1003-1005)
- **Database Schema**: `/var/www/beautycita.com/database/schema.sql`
- **SMS Service**: `/var/www/beautycita.com/backend/src/smsService.js`

## Support

For issues or questions:
- Check logs: `pm2 logs beautycita-api`
- Review webhook events in database
- Test with BTCPay's built-in tools
- Verify all environment variables are set

---

**Last Updated**: October 2, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
