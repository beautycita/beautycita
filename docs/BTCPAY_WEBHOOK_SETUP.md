# BTCPay Server - Webhook Setup Guide

**Created:** October 27, 2025
**Purpose:** Configure BTCPay Server webhooks for automated payment processing

---

## Overview

BTCPay Server sends webhook events to your backend when invoice states change. These webhooks automate:

- Payment detection and confirmation
- Booking status updates
- SMS notifications to clients and stylists
- In-app notifications
- Payment logging and audit trail

---

## Webhook Endpoint

**URL:** `https://beautycita.com/api/webhooks/btcpay`

**Method:** POST
**Content-Type:** application/json
**Authentication:** HMAC SHA256 signature (header: `btcpay-sig`)

---

## Required Events

Configure BTCPay to send these webhook events:

### 1. InvoiceReceivedPayment
**When:** Payment transaction detected (0 confirmations)
**Action:**
- Update payment status to `PROCESSING`
- Send SMS to client: "Payment detected and confirming..."
- Log event in database

### 2. InvoiceProcessing
**When:** Payment is processing (seen in mempool)
**Action:**
- Update payment status to `PROCESSING`
- Notify client payment is being confirmed

### 3. InvoiceSettled / InvoicePaymentSettled
**When:** Payment confirmed (sufficient confirmations)
**Action:**
- Update payment status to `SUCCEEDED`
- Update booking status to `CONFIRMED`
- Send SMS to client: "✅ Payment confirmed! Your booking is confirmed."
- Send SMS to stylist: "🎉 New booking confirmed! Client: X, Date: Y"
- Create in-app notifications for both parties
- Log confirmation timestamp

### 4. InvoiceExpired
**When:** Invoice expires before payment
**Action:**
- Update payment status to `FAILED`
- Cancel booking (if still pending)
- Set cancellation reason: "Payment invoice expired"
- Log expiration

### 5. InvoiceInvalid
**When:** Payment issue detected (overpaid, underpaid, wrong address, etc.)
**Action:**
- Update payment status to `FAILED`
- Log issue details
- **Show support page link** (this is where the support URL helps)

---

## BTCPay Configuration Steps

### Step 1: Access BTCPay Server

1. Navigate to: **https://beautycita.com/btcpay**
2. Login with admin credentials
3. Select your store (e.g., "BeautyCita Store")

### Step 2: Navigate to Webhooks

1. Click on your store name in top navigation
2. In left sidebar: **Settings** → **Webhooks**
3. Click **"Create Webhook"** button

### Step 3: Configure Webhook

Fill in the webhook configuration:

**Payload URL:**
```
https://beautycita.com/api/webhooks/btcpay
```

**Secret:** (from .env file)
```
Q8WQt6eb67HTyLw7YdBKjy9fgeU
```
*(This is `BTCPAY_WEBHOOK_SECRET` from your .env file)*

**Automatic redelivery:**
- ✅ **Enabled** (recommended)
- Retry failed deliveries up to 6 times

**Events to send:**

Select these events:
- ✅ **Invoice received payment** (InvoiceReceivedPayment)
- ✅ **Invoice processing** (InvoiceProcessing)
- ✅ **Invoice settled** (InvoiceSettled)
- ✅ **Invoice payment settled** (InvoicePaymentSettled)
- ✅ **Invoice expired** (InvoiceExpired)
- ✅ **Invoice invalid** (InvoiceInvalid)

**Optional events** (for advanced features):
- ☐ Invoice created (InvoiceCreated)
- ☐ Invoice confirmed (InvoiceConfirmed)
- ☐ Invoice partially paid (InvoicePartiallyPaid)

### Step 4: Save Webhook

1. Click **"Create"** button
2. You'll see the webhook in the list
3. Note the webhook ID for reference

---

## Testing the Webhook

### Method 1: BTCPay Test Delivery

1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. Scroll to **"Recent Deliveries"** section
4. Click **"Redeliver"** on any past event (or create test invoice to trigger new event)
5. Check response:
   - ✅ **200 OK** = Success
   - ❌ **401 Unauthorized** = Invalid signature
   - ❌ **500 Error** = Backend issue

### Method 2: Create Test Invoice

1. **In BTCPay:** Invoices → Create Invoice
2. Fill in:
   - Amount: $10
   - Order ID: TEST-ORDER-123
   - Description: "Test booking payment"
   - Metadata (JSON):
     ```json
     {
       "bookingId": "999",
       "customerEmail": "test@example.com",
       "serviceName": "Test Service",
       "appointmentDate": "2025-11-01",
       "stylistName": "Test Stylist"
     }
     ```
3. Click **"Create"**
4. **Webhook should fire:** InvoiceCreated (if enabled)

### Method 3: Manual Webhook Testing

Use curl to simulate BTCPay webhook:

```bash
# Generate signature
WEBHOOK_SECRET="Q8WQt6eb67HTyLw7YdBKjy9fgeU"
PAYLOAD='{"type":"InvoiceSettled","invoiceId":"test123","storeId":"store123","metadata":{"bookingId":"999"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST https://beautycita.com/api/webhooks/btcpay \
  -H "Content-Type: application/json" \
  -H "btcpay-sig: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{"success": true}
```

---

## Webhook Security

### HMAC Signature Validation

Every webhook includes a signature in the `btcpay-sig` header:

```
btcpay-sig: sha256=abc123def456...
```

**Backend validation process:**

1. Read webhook secret from environment
2. Compute HMAC-SHA256 of request body using secret
3. Compare computed signature with header signature (timing-safe)
4. Reject if signatures don't match (401 Unauthorized)

**Implementation:** Already implemented in `/var/www/beautycita.com/backend/src/routes/btcpay-webhooks.js`

### IP Whitelisting (Optional)

For extra security, restrict webhook endpoint to BTCPay server IP:

**In Nginx config:**
```nginx
location /api/webhooks/btcpay {
    allow 127.0.0.1;  # BTCPay running on same server
    deny all;

    proxy_pass http://beautycita_api;
}
```

### HTTPS Only

- Webhooks MUST use HTTPS
- BTCPay will reject HTTP URLs
- SSL certificate verified automatically

---

## Webhook Payload Examples

### InvoiceReceivedPayment

```json
{
  "deliveryId": "webhook-delivery-123",
  "webhookId": "webhook-456",
  "originalDeliveryId": null,
  "isRedelivery": false,
  "type": "InvoiceReceivedPayment",
  "timestamp": 1698765432,
  "storeId": "7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D",
  "invoiceId": "abc123xyz",
  "metadata": {
    "bookingId": "456",
    "orderId": "ORDER-2025-1234",
    "customerEmail": "client@example.com",
    "serviceName": "Haircut & Color",
    "appointmentDate": "2025-11-15",
    "stylistName": "Maria Garcia"
  },
  "paymentMethod": "BTC-OnChain"
}
```

### InvoiceSettled

```json
{
  "deliveryId": "webhook-delivery-789",
  "webhookId": "webhook-456",
  "originalDeliveryId": null,
  "isRedelivery": false,
  "type": "InvoiceSettled",
  "timestamp": 1698766000,
  "storeId": "7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D",
  "invoiceId": "abc123xyz",
  "metadata": {
    "bookingId": "456",
    "orderId": "ORDER-2025-1234",
    "customerEmail": "client@example.com",
    "serviceName": "Haircut & Color",
    "appointmentDate": "2025-11-15",
    "stylistName": "Maria Garcia"
  },
  "overPaid": false,
  "partiallyPaid": false
}
```

### InvoiceExpired (Partial Payment)

```json
{
  "deliveryId": "webhook-delivery-999",
  "webhookId": "webhook-456",
  "type": "InvoiceExpired",
  "timestamp": 1698767000,
  "storeId": "7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D",
  "invoiceId": "abc123xyz",
  "metadata": {
    "bookingId": "456",
    "orderId": "ORDER-2025-1234"
  },
  "partiallyPaid": true,
  "payment": {
    "total": "0.00050000",
    "paid": "0.00025000",
    "due": "0.00025000"
  }
}
```

**This triggers the support page link!**

---

## Database Logging

All webhook events are logged to `btcpay_webhook_events` table:

```sql
CREATE TABLE btcpay_webhook_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  invoice_id VARCHAR(255) NOT NULL,
  store_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Query recent webhooks:**
```sql
SELECT event_type, invoice_id, processed, created_at
FROM btcpay_webhook_events
ORDER BY created_at DESC
LIMIT 20;
```

**Find failed webhooks:**
```sql
SELECT *
FROM btcpay_webhook_events
WHERE processed = false OR error IS NOT NULL
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Webhook Not Firing

**Issue:** BTCPay not sending webhooks

**Solutions:**
1. Verify webhook is enabled in BTCPay settings
2. Check webhook URL is correct (HTTPS required)
3. Test with "Redeliver" button in BTCPay
4. Check BTCPay logs: `sudo docker logs btcpay_server | grep webhook`

### 401 Unauthorized

**Issue:** Backend rejecting webhooks with signature error

**Solutions:**
1. Verify `BTCPAY_WEBHOOK_SECRET` in .env matches BTCPay webhook secret
2. Check signature validation logic in `btcpay-webhooks.js`
3. Test manually with curl (see testing section)
4. Ensure no extra whitespace in secret

### 500 Internal Server Error

**Issue:** Backend processing fails

**Solutions:**
1. Check backend logs: `sudo -u www-data pm2 logs beautycita-api`
2. Verify database connection is working
3. Check if `btcpay_webhook_events` table exists
4. Ensure payment/booking records exist for the invoice

### Webhook Delivered but No Action

**Issue:** Webhook received but booking not updated

**Solutions:**
1. Check if `metadata.bookingId` is included in webhook payload
2. Verify booking exists in database
3. Check if payment record exists with matching `btcpay_invoice_id`
4. Review webhook event log for errors:
   ```sql
   SELECT * FROM btcpay_webhook_events WHERE invoice_id = 'abc123xyz';
   ```

### SMS Not Sent

**Issue:** Webhook processed but no SMS received

**Solutions:**
1. Verify Twilio credentials in .env
2. Check phone number format (E.164: +1234567890)
3. Review Twilio balance and account status
4. Check backend logs for SMS errors
5. Verify client/stylist has valid phone number in database

---

## Webhook Retry Logic

BTCPay automatically retries failed webhooks:

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: 10 seconds
- Attempt 3: 1 minute
- Attempt 4: 10 minutes
- Attempt 5: 1 hour
- Attempt 6: 6 hours

**After 6 failures:** Webhook delivery marked as permanently failed

**Best Practice:**
- Return 200 OK as quickly as possible
- Process heavy tasks asynchronously
- Log errors for manual review

---

## Monitoring Webhooks

### Backend Logs

Monitor webhook processing:
```bash
# Real-time webhook logs
sudo -u www-data pm2 logs beautycita-api | grep BTCPay

# Recent webhook events
sudo -u www-data pm2 logs beautycita-api --lines 100 | grep "Webhook"
```

### Database Queries

**Daily webhook stats:**
```sql
SELECT
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE processed = true) as processed,
  COUNT(*) FILTER (WHERE error IS NOT NULL) as errors
FROM btcpay_webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY total DESC;
```

**Failed webhooks:**
```sql
SELECT *
FROM btcpay_webhook_events
WHERE error IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Prometheus Metrics (Future)

Add webhook metrics to Prometheus:
- `btcpay_webhooks_received_total`
- `btcpay_webhooks_processed_total`
- `btcpay_webhooks_errors_total`
- `btcpay_webhook_processing_duration_seconds`

---

## Support Page Integration

When an invoice expires with partial payment, BTCPay shows "Contact Us" button linking to:

```
https://beautycita.com/support/btc-payment?OrderId={OrderId}&InvoiceId={InvoiceId}
```

**Webhook event:** `InvoiceExpired` with `partiallyPaid: true`

**Backend action:** None required (support page handles user contact)

**Alternative:** Send proactive email to customer:

```javascript
async function handleInvoiceExpired(event, webhookId) {
  if (event.partiallyPaid) {
    // Get customer email from metadata
    const email = event.metadata.customerEmail;

    // Send support email with link
    await sendEmail({
      to: email,
      subject: 'Bitcoin Payment Issue - BeautyCita',
      body: `
        We noticed your Bitcoin payment was only partially completed.

        Order ID: ${event.metadata.orderId}
        Invoice ID: ${event.invoiceId}

        Please contact support to resolve this:
        https://beautycita.com/support/btc-payment?OrderId=${event.metadata.orderId}&InvoiceId=${event.invoiceId}
      `
    });
  }
}
```

---

## Quick Reference

### Webhook Endpoint
```
POST https://beautycita.com/api/webhooks/btcpay
```

### Required Environment Variables
```bash
BTCPAY_WEBHOOK_SECRET=Q8WQt6eb67HTyLw7YdBKjy9fgeU
BTCPAY_URL=https://beautycita.com/btcpay
BTCPAY_API_KEY=4aeece89a8c1d397a94451dd8180f8fa2e5b93d4
BTCPAY_STORE_ID=7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D
```

### Events to Configure
- InvoiceReceivedPayment ✅
- InvoiceProcessing ✅
- InvoiceSettled ✅
- InvoicePaymentSettled ✅
- InvoiceExpired ✅
- InvoiceInvalid ✅

### Support URL to Configure
```
https://beautycita.com/support/btc-payment?OrderId={OrderId}&InvoiceId={InvoiceId}
```

---

## Summary

✅ **Webhook endpoint ready:** `/api/webhooks/btcpay`
✅ **Event handlers implemented:** All 6 critical events
✅ **Security configured:** HMAC signature validation
✅ **Database logging:** Complete audit trail
✅ **SMS notifications:** Client and stylist alerts
✅ **Support page created:** For partial payment issues

**Next Steps:**
1. Access BTCPay admin UI
2. Navigate to Settings → Webhooks
3. Create webhook with endpoint URL
4. Add webhook secret from .env
5. Select all 6 events
6. Save and test with sample invoice

---

**Last Updated:** October 27, 2025
**Maintained By:** BeautyCita Development Team
