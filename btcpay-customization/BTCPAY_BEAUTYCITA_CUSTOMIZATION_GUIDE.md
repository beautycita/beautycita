# BTCPay Server - BeautyCita Customization Guide

**Created:** October 10, 2025
**Purpose:** Complete guide to customizing BTCPay Server with BeautyCita branding

---

## 📋 Overview

This guide provides step-by-step instructions to customize BTCPay Server with BeautyCita's pink-to-purple gradient brand identity, including:

- ✅ **Checkout page styling** (invoice/payment page)
- ✅ **Email templates** (invoice notifications, payment confirmations)
- ✅ **Backend/Admin dashboard styling**
- ✅ **Logo and branding**

---

## 🎨 BeautyCita Brand Identity

### Color Palette
- **Primary Pink:** `#ec4899` (pink-500)
- **Primary Purple:** `#9333ea` (purple-600)
- **Signature Gradient:** `linear-gradient(to right, #ec4899, #9333ea)`

### Typography
- **Headings:** Playfair Display (serif)
- **Body Text:** Inter (sans-serif)

### Design Principles
- Pill-shaped buttons (`border-radius: 9999px`)
- Large rounded corners for cards (`border-radius: 16-24px`)
- Smooth animations and transitions
- Pink-to-purple gradients everywhere
- Clean, feminine, Instagram-level polish

---

## 📦 Files Created

All customization files are in `/tmp/`:

1. **`beautycita-checkout.css`** - Checkout page styling (558 lines)
2. **`beautycita-email-invoice.html`** - Invoice email template
3. **`beautycita-email-payment-confirmed.html`** - Payment confirmation email
4. **`beautycita-backend.css`** - Admin dashboard styling (679 lines)

---

## 🚀 Implementation Steps

### Step 1: Start BTCPay Server

BTCPay is currently stopped. Start the containers:

```bash
cd /var/www/btcpay
sudo docker-compose up -d
```

Wait 2-3 minutes for services to initialize, then check status:

```bash
sudo docker ps | grep btcpay
```

You should see:
- `btcpay_bitcoind`
- `btcpay_nbxplorer`
- `btcpay_server`
- `btcpay_postgres`
- `btcpay_clightning`
- `btcpay_nginx`

### Step 2: Access BTCPay Server

Navigate to: **https://beautycita.com/btcpay**

**Login credentials:** (Create admin account if first time)

---

## 🎨 Checkout Page Customization

### Upload Custom CSS

1. **Go to Store Settings**
   - Click on your store name (top left)
   - Select "Settings" from dropdown

2. **Navigate to Checkout Appearance**
   - In left sidebar: "Checkout" → "Checkout Appearance"

3. **Upload Custom CSS**
   - Scroll to "Custom CSS" section
   - Click "Upload file" or paste CSS content
   - Upload: `/tmp/beautycita-checkout.css`
   - Click "Save"

### Add BeautyCita Logo

1. **In Checkout Appearance settings:**
   - Find "Custom Logo" section
   - Upload BeautyCita logo (PNG with transparent background)
   - Recommended size: 300x100px
   - Click "Save"

### Preview Checkout

1. Create a test invoice:
   - Go to "Invoices" → "Create Invoice"
   - Amount: $10
   - Description: "Test"
   - Click "Create"

2. View invoice page to see BeautyCita styling

---

## 📧 Email Template Customization

### Configure Email Settings

1. **Go to Server Settings** (admin access required)
   - Click gear icon (top right) → "Server Settings"

2. **Navigate to Email Settings**
   - Left sidebar: "Emails"

3. **Configure SMTP Server**
   ```
   SMTP Server: smtp.sendgrid.net (or your email provider)
   Port: 587
   Use SSL: Yes
   Username: apikey
   Password: [Your SendGrid API Key]
   From: noreply@beautycita.com
   From Name: BeautyCita
   ```

### Upload Email Templates

BTCPay Server currently doesn't support custom HTML email templates directly, but you can:

**Option 1: Use Webhook to Send Custom Emails**

1. BTCPay webhook is already configured at `/api/webhooks/btcpay`

2. Update backend webhook handler to send custom emails:
   - Read `/tmp/beautycita-email-invoice.html`
   - Replace placeholders with actual data
   - Send via SendGrid/SMTP

**Option 2: Request BTCPay Plugin**

1. BTCPay supports plugins for extended functionality
2. Create or request a "Custom Email Templates" plugin

**For now, use Option 1** - the webhook handler can send beautiful branded emails.

---

## 🖥️ Backend/Admin Dashboard Customization

### Upload Custom Backend CSS

1. **Go to Server Settings** (admin/superuser access required)
   - Click gear icon (top right) → "Server Settings"

2. **Navigate to Branding**
   - Left sidebar: "Policies" → "Branding"

3. **Upload Custom CSS**
   - Scroll to "Custom Theme CSS (Server-wide)"
   - Upload: `/tmp/beautycita-backend.css`
   - Click "Save"

### Configure Branding

1. **Still in Branding settings:**

   **Custom Logo:**
   - Upload BeautyCita logo
   - Recommended: 200x60px PNG

   **Custom HTML (Header):**
   ```html
   <style>
   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
   </style>
   ```

   **Footer:**
   - Leave default or customize

2. **Save Changes**

### Test Admin Dashboard

1. Navigate to different admin pages:
   - Dashboard
   - Invoices
   - Stores
   - Settings

2. Verify BeautyCita styling:
   - ✅ Pink-to-purple gradients
   - ✅ Pill-shaped buttons
   - ✅ Rounded cards
   - ✅ Proper fonts (Playfair + Inter)

---

## 🎯 Verification Checklist

### ✅ Checkout Page
- [ ] Pink-to-purple gradient header
- [ ] BeautyCita logo visible and white
- [ ] Pill-shaped buttons (Pay Now, Copy Address)
- [ ] Amount displayed in gradient text
- [ ] QR code with gradient border
- [ ] Responsive on mobile
- [ ] Dark mode support

### ✅ Email Templates
- [ ] SMTP configured and sending
- [ ] Webhook handler updated to use custom templates
- [ ] Test invoice email sent successfully
- [ ] Test payment confirmation email sent
- [ ] All placeholders replaced with actual data
- [ ] Branded footer with logo

### ✅ Backend Dashboard
- [ ] Sidebar navigation with gradient active states
- [ ] All buttons are pill-shaped
- [ ] Cards have rounded corners (16px)
- [ ] Gradient on primary buttons
- [ ] Tables styled with gradient headers
- [ ] Badges are pill-shaped
- [ ] Forms have proper styling
- [ ] Responsive on mobile

---

## 🔧 Troubleshooting

### Checkout Page: Styles Not Applying

**Issue:** Custom CSS not showing on checkout page

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check if CSS was saved properly (revisit settings)
3. Verify no syntax errors in CSS (browser console)
4. Try incognito/private mode

### Backend: Styles Not Applying

**Issue:** Admin dashboard still uses default BTCPay styling

**Solutions:**
1. Ensure you have server-wide admin access
2. Clear browser cache
3. Check "Branding" settings saved properly
4. Fonts may take a moment to load (Google Fonts CDN)

### Emails: Not Sending

**Issue:** Emails not being sent or received

**Solutions:**
1. Verify SMTP settings are correct
2. Check email logs: `sudo docker logs btcpay_server | grep -i email`
3. Test SMTP connection:
   ```bash
   telnet smtp.sendgrid.net 587
   ```
4. Ensure webhook handler is processing events

### Logo: Not Showing

**Issue:** Logo not visible or broken

**Solutions:**
1. Check file size (< 500KB recommended)
2. Use PNG format with transparent background
3. Verify file uploaded successfully
4. Check image URL in page source (browser dev tools)

---

## 🎨 Customization Variables

### Checkout Page (`beautycita-checkout.css`)

To change colors, edit these variables at the top:

```css
:root {
    --beautycita-pink: #ec4899;
    --beautycita-purple: #9333ea;
    --beautycita-gradient: linear-gradient(to right, #ec4899, #9333ea);
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
}
```

### Backend Dashboard (`beautycita-backend.css`)

```css
:root {
    --bc-pink: #ec4899;
    --bc-purple: #9333ea;
    --bc-gradient: linear-gradient(to right, #ec4899, #9333ea);
    --bc-success: #10b981;
    --bc-warning: #f59e0b;
    --bc-error: #ef4444;
}
```

### Email Templates

Replace these placeholders in HTML templates:

**Invoice Email:**
- `{{LOGO_URL}}` - BeautyCita logo URL
- `{{INVOICE_ID}}` - Invoice number
- `{{AMOUNT}}` - Payment amount
- `{{CURRENCY}}` - BTC/USD/etc
- `{{SERVICE_NAME}}` - Service description
- `{{APPOINTMENT_DATE}}` - Appointment date/time
- `{{STYLIST_NAME}}` - Professional name
- `{{INVOICE_URL}}` - Payment page URL
- `{{EXPIRY_TIME}}` - Invoice expiration countdown
- `{{BEAUTYCITA_URL}}` - https://beautycita.com
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link

**Payment Confirmation Email:**
- All above, plus:
- `{{TRANSACTION_ID}}` - Blockchain transaction ID
- `{{APPOINTMENT_TIME}}` - Time only
- `{{SALON_ADDRESS}}` - Salon location
- `{{ADD_TO_CALENDAR_URL}}` - iCal/Google Calendar link
- `{{DASHBOARD_URL}}` - User dashboard URL

---

## 📝 Email Template Integration

### Update Webhook Handler

The webhook handler is at: `/var/www/beautycita.com/backend/src/webhookRoutes.js`

**Add email sending function:**

```javascript
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASSWORD
  }
});

// Function to send branded invoice email
async function sendInvoiceEmail(invoiceData) {
  // Read template
  const templatePath = path.join(__dirname, '../email-templates/invoice.html');
  let html = await fs.readFile(templatePath, 'utf8');

  // Replace placeholders
  html = html.replace(/{{LOGO_URL}}/g, 'https://beautycita.com/logo.png')
             .replace(/{{INVOICE_ID}}/g, invoiceData.id)
             .replace(/{{AMOUNT}}/g, invoiceData.amount)
             .replace(/{{CURRENCY}}/g, invoiceData.currency)
             .replace(/{{SERVICE_NAME}}/g, invoiceData.metadata.serviceName || 'Beauty Service')
             .replace(/{{APPOINTMENT_DATE}}/g, invoiceData.metadata.appointmentDate)
             .replace(/{{STYLIST_NAME}}/g, invoiceData.metadata.stylistName)
             .replace(/{{INVOICE_URL}}/g, invoiceData.checkoutLink)
             .replace(/{{EXPIRY_TIME}}/g, calculateExpiry(invoiceData.expirationTime));

  // Send email
  await transporter.sendMail({
    from: 'BeautyCita <noreply@beautycita.com>',
    to: invoiceData.metadata.customerEmail,
    subject: `Payment Invoice #${invoiceData.id} - BeautyCita`,
    html: html
  });
}

// In your webhook handler:
router.post('/btcpay', async (req, res) => {
  const event = req.body;

  if (event.type === 'InvoiceCreated') {
    await sendInvoiceEmail(event.data);
  }

  if (event.type === 'InvoiceSettled') {
    await sendPaymentConfirmationEmail(event.data);
  }

  res.json({ received: true });
});
```

### Copy Email Templates

```bash
# Create email templates directory
mkdir -p /var/www/beautycita.com/backend/email-templates

# Copy templates
cp /tmp/beautycita-email-invoice.html /var/www/beautycita.com/backend/email-templates/invoice.html
cp /tmp/beautycita-email-payment-confirmed.html /var/www/beautycita.com/backend/email-templates/payment-confirmed.html

# Set permissions
chown -R beautycita:www-data /var/www/beautycita.com/backend/email-templates
chmod -R 664 /var/www/beautycita.com/backend/email-templates/*
```

### Install Nodemailer

```bash
cd /var/www/beautycita.com/backend
npm install nodemailer
```

### Configure .env

Add to `/var/www/beautycita.com/backend/.env`:

```env
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key_here
SMTP_FROM=noreply@beautycita.com
SMTP_FROM_NAME=BeautyCita
```

### Restart Backend

```bash
beautycita-pm2 restart beautycita-api
```

---

## 🎯 Advanced Customization

### Add Google Fonts

The CSS files reference Google Fonts. To ensure they load, add to BTCPay header:

**Server Settings → Branding → Custom HTML (Header):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Custom Checkout Messages

**Store Settings → Checkout Appearance:**

**Checkout Description:**
```
💅 Complete your payment to confirm your BeautyCita appointment. We accept Bitcoin and Lightning Network for instant confirmations!
```

**Receipt:** (Shown after payment)
```
🎉 Payment confirmed! Your BeautyCita appointment is now secured. We can't wait to make you look and feel amazing!

You'll receive a confirmation email shortly with all the details.
```

### Add Social Links to Emails

Update email templates with actual social media URLs:

- `{{INSTAGRAM_URL}}` → https://instagram.com/beautycita
- `{{FACEBOOK_URL}}` → https://facebook.com/beautycita
- `{{TWITTER_URL}}` → https://twitter.com/beautycita

---

## 📊 Testing Checklist

### Create Test Invoice

1. Go to BTCPay Dashboard
2. Invoices → Create Invoice
3. Fill in test data:
   - Amount: $25
   - Description: "Test Appointment"
   - Buyer Email: your-email@example.com
4. Click Create
5. Copy invoice URL

### Test Checkout Flow

1. Open invoice URL in incognito window
2. Verify BeautyCita styling
3. Check responsive design (resize browser)
4. Test buttons (hover effects, click states)
5. Check timer countdown
6. Copy payment address (verify copy button works)

### Test Email Flow

1. Create invoice with valid email
2. Wait for invoice creation email
3. Make test payment (testnet)
4. Wait for payment confirmation email
5. Verify all placeholders are replaced
6. Check email rendering in different clients:
   - Gmail
   - Outlook
   - iPhone Mail
   - Android Mail

---

## 🔐 Security Notes

1. **CSS Injection:** BTCPay sanitizes CSS to prevent malicious code
2. **Email Headers:** DKIM/SPF should be configured for beautycita.com domain
3. **Logo URLs:** Use HTTPS URLs only
4. **Webhook Secret:** Verify webhook signatures (already implemented)
5. **SMTP Credentials:** Store in environment variables, never commit to git

---

## 📚 Resources

### BTCPay Server Documentation
- [Custom Themes](https://docs.btcpayserver.org/Themes/)
- [Checkout Customization](https://docs.btcpayserver.org/Invoices/)
- [Webhook Events](https://docs.btcpayserver.org/API/Greenfield/v1/)

### BeautyCita Style Guide
- `/var/www/beautycita.com/frontend/BEAUTYCITA_STYLE_GUIDE.md`

### Support
- **BTCPay Community:** https://chat.btcpayserver.org
- **BeautyCita Support:** support@beautycita.com

---

## ✅ Final Steps

Once all customizations are applied:

1. **Test end-to-end flow:**
   - Create invoice
   - View checkout page
   - Receive invoice email
   - Make payment (testnet)
   - Receive confirmation email

2. **Get user feedback:**
   - Share test invoice with team
   - Verify branding matches BeautyCita website
   - Check mobile experience

3. **Document for team:**
   - Share this guide
   - Create video walkthrough if needed
   - Set up monitoring for email deliverability

4. **Go live:**
   - Switch from testnet to mainnet in docker-compose.yml
   - Update webhook URLs to production
   - Enable Bitcoin payments in BeautyCita app

---

## 🎨 Result

After completing this guide, you'll have:

✅ **Checkout page** with pink-purple BeautyCita branding
✅ **Email templates** matching BeautyCita design system
✅ **Admin dashboard** styled with BeautyCita colors and fonts
✅ **Seamless brand experience** from booking to payment to confirmation

**BTCPay Server will look like it's a native part of the BeautyCita platform!** 💅✨

---

*Generated: October 10, 2025*
*Location: /tmp/BTCPAY_BEAUTYCITA_CUSTOMIZATION_GUIDE.md*
*For: BeautyCita Platform*
