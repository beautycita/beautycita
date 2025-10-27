# BTCPay Server - Support URL Configuration

**Created:** October 27, 2025
**Purpose:** Configure BTCPay Server to show "Contact Us" button for partial payment issues

---

## Overview

BTCPay Server supports showing a "Contact Us" button on invoice expired pages when there are partially paid invoices. The button can link to any valid URI (website, email, Nostr, etc.) and supports placeholders for Order ID and Invoice ID.

---

## Support Page Created

**URL:** `https://beautycita.com/support/btc-payment`

**Features:**
- Automatically extracts `OrderId` and `InvoiceId` from URL parameters
- Pre-fills support form with invoice details
- Shows common Bitcoin payment issues and solutions
- Multiple contact methods (email, live chat)
- Branded with BeautyCita design system
- Mobile responsive

---

## Configuration Steps

### 1. Access BTCPay Server

Navigate to: **https://beautycita.com/btcpay**

Login with your admin credentials.

### 2. Go to Store Settings

1. Click on your store name in the top navigation
2. Select the store you want to configure (e.g., "BeautyCita Store")
3. Click "Settings" in the left sidebar

### 3. Navigate to Checkout Settings

1. In the left sidebar, find "Checkout"
2. Click on "Checkout Experience" or "Checkout Appearance"

### 4. Configure Support URL

Look for the setting called **"Support URL"** or **"Contact URL"** (the exact name may vary by BTCPay version).

**Enter this URL:**

```
https://beautycita.com/support/btc-payment?OrderId={OrderId}&InvoiceId={InvoiceId}
```

**Important:**
- Use the exact placeholders `{OrderId}` and `{InvoiceId}` (case-sensitive)
- BTCPay will automatically replace these with actual values
- The URL must be HTTPS for security

### 5. Save Changes

Click "Save" at the bottom of the page.

---

## Alternative Configuration Locations

Depending on your BTCPay Server version, the support URL setting might be in:

### Option A: Store Settings → Checkout → Checkout Appearance
- Under "Invoice Settings" section
- Field name: "Support URL" or "Contact URL for partial payments"

### Option B: Store Settings → Checkout → General
- Under "Invoice Expiry" section
- Field name: "Redirect URL for expired invoices with partial payments"

### Option C: Store Settings → Email
- Under "Customer Email Settings"
- Field name: "Support contact URL"

---

## Testing the Configuration

### 1. Create a Test Invoice

1. Go to "Invoices" → "Create Invoice"
2. Fill in test data:
   - Amount: $10
   - Order ID: TEST-ORDER-123
   - Buyer Email: your-email@example.com
   - Description: "Test partial payment support"
3. Click "Create"

### 2. Simulate Partial Payment

1. Open the invoice in a new browser window
2. Note the Invoice ID (e.g., `abc123xyz`)
3. Send a partial payment (less than the full amount)
4. Wait for invoice to expire (or manually expire it if testing)

### 3. Verify Support Button

On the expired invoice page, you should see:

- A "Contact Us" or "Get Support" button
- Clicking it redirects to:
  ```
  https://beautycita.com/support/btc-payment?OrderId=TEST-ORDER-123&InvoiceId=abc123xyz
  ```

### 4. Verify Support Page

1. The support page should automatically show:
   - Order ID: TEST-ORDER-123
   - Invoice ID: abc123xyz
2. Form should be pre-filled with these values
3. User can describe the issue and submit

---

## URL Placeholders

BTCPay Server supports these placeholders:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{OrderId}` | Order ID from invoice metadata | `ORDER-2025-1234` |
| `{InvoiceId}` | BTCPay invoice identifier | `abc123xyz789` |
| `{StoreId}` | Store identifier | `7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D` |
| `{Amount}` | Invoice amount | `50.00` |
| `{Currency}` | Invoice currency | `USD` |

**Example Advanced URL:**

```
https://beautycita.com/support/btc-payment?OrderId={OrderId}&InvoiceId={InvoiceId}&Amount={Amount}&Currency={Currency}
```

---

## Alternative Contact Methods

If you prefer different contact methods, you can use:

### Email Link

```
mailto:support@beautycita.com?subject=Bitcoin%20Payment%20Issue%20-%20Invoice%20{InvoiceId}&body=Order%20ID:%20{OrderId}%0AInvoice%20ID:%20{InvoiceId}
```

### Telegram

```
https://t.me/beautycita_support?text=I%20need%20help%20with%20Order%20{OrderId}%20Invoice%20{InvoiceId}
```

### Discord

```
https://discord.gg/beautycita?prefill=Order:{OrderId}|Invoice:{InvoiceId}
```

### Nostr

```
nostr:npub1beautycita...?message=Help%20with%20{OrderId}%20{InvoiceId}
```

---

## Webhook Integration (Optional)

For automated support ticket creation, you can:

1. Configure BTCPay webhook to send events to your backend
2. Listen for `InvoiceExpired` events with partial payments
3. Automatically create support tickets with invoice details
4. Send proactive email to customer with support link

**Webhook endpoint (already configured):**
```
https://beautycita.com/api/webhooks/btcpay
```

**Event to listen for:**
```json
{
  "type": "InvoiceExpired",
  "data": {
    "id": "abc123xyz",
    "status": "Expired",
    "metadata": {
      "orderId": "ORDER-123"
    },
    "payment": {
      "total": "50.00",
      "paid": "25.00",
      "due": "25.00"
    }
  }
}
```

---

## Support Page Features

The BeautyCita BTC Payment Support page includes:

### ✅ Automatic Data Extraction
- Reads `OrderId` and `InvoiceId` from URL parameters
- Pre-fills form fields
- Shows payment details banner

### ✅ Common Issues Section
- Payment Expired
- Partial Payment
- Transaction Failed
- Wrong Amount Sent

### ✅ Support Form
- Name, email, phone fields
- Pre-filled Order ID and Invoice ID (disabled fields)
- Message textarea for issue description
- Submit button sends to backend contact API

### ✅ Alternative Contact Methods
- Email support (with pre-filled subject)
- Live chat link
- Phone support (business hours)

### ✅ Helpful Information
- What to include in support request
- Transaction ID/hash guidance
- Screenshot instructions
- Wallet information tips

---

## Backend Integration

The support form submits to:

```
POST /api/contact
```

**Payload:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "subject": "Bitcoin Payment Support - Invoice abc123xyz",
  "message": "I made a partial payment but the invoice expired...",
  "inquiryType": "btc-payment-support",
  "userType": "btc-payment-support",
  "orderId": "ORDER-123",
  "invoiceId": "abc123xyz"
}
```

This creates a support ticket in the system and sends notification emails to the support team.

---

## Troubleshooting

### Support URL Not Showing

**Issue:** "Contact Us" button doesn't appear on expired invoices

**Solutions:**
1. Verify support URL is saved in BTCPay settings
2. Ensure invoice has partial payment (not zero payment)
3. Check BTCPay Server version (feature added in v1.6.0+)
4. Clear browser cache and test in incognito mode

### Placeholders Not Replaced

**Issue:** URL shows literal `{OrderId}` instead of actual value

**Solutions:**
1. Verify exact spelling and capitalization: `{OrderId}` not `{orderId}`
2. Ensure Order ID was set when creating invoice
3. Update BTCPay Server to latest version
4. Check BTCPay logs for errors

### Support Page Not Loading

**Issue:** Clicking "Contact Us" shows 404 error

**Solutions:**
1. Verify frontend build includes BtcPaymentSupportPage
2. Check React Router route is configured
3. Test URL directly: https://beautycita.com/support/btc-payment
4. Check Nginx logs for routing errors

---

## Security Considerations

1. **HTTPS Only:** Support URL must use HTTPS
2. **Input Validation:** Support page validates all URL parameters
3. **CSRF Protection:** Form submissions include CSRF tokens
4. **Rate Limiting:** API endpoint has rate limiting to prevent abuse
5. **Sanitization:** All user inputs are sanitized before storage

---

## Monitoring

Track support requests via:

1. **Backend logs:**
   ```bash
   sudo -u www-data pm2 logs beautycita-api | grep "btc-payment-support"
   ```

2. **Database query:**
   ```sql
   SELECT COUNT(*) FROM contact_requests
   WHERE inquiry_type = 'btc-payment-support'
   AND created_at > NOW() - INTERVAL '30 days';
   ```

3. **Email notifications:**
   - Support team receives email for each BTC payment support request
   - Includes Order ID, Invoice ID, and issue description

---

## References

- **BTCPay Documentation:** https://docs.btcpayserver.org/Invoices/#invoice-settings
- **Support Page:** https://beautycita.com/support/btc-payment
- **Contact API:** https://beautycita.com/api/contact
- **Webhook Docs:** https://docs.btcpayserver.org/API/Greenfield/v1/#tag/Webhooks

---

## Next Steps

1. ✅ Create support page (completed)
2. ✅ Add React Router route (completed)
3. ⏳ Configure BTCPay support URL (manual step via admin UI)
4. ⏳ Test with partial payment scenario
5. ⏳ Monitor support requests
6. ⏳ Update support team procedures

---

**Configuration Status:** Ready for BTCPay Admin UI setup

**Last Updated:** October 27, 2025

**Maintained By:** BeautyCita Development Team
