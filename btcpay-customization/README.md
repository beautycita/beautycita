# BeautyCita BTCPay Server Theme Installation Guide

Your BTCPay Server theme files are ready! Follow these simple steps to apply them.

## 🎨 Theme Files

1. **beautycita-checkout.css** - Styles the customer-facing checkout/invoice pages
2. **beautycita-backend.css** - Styles the admin dashboard and backend pages

---

## 📋 Installation Steps

### Step 1: Upload Checkout Theme (Customer-Facing)

1. Open your browser and go to: **https://beautycita.com/btcpay/**
2. Log in to BTCPay Server
3. Click on your **Store name** in the top navigation
4. Go to **Settings** → **Checkout Appearance**
5. Scroll down to **Custom CSS** section
6. Open the file: `beautycita-checkout.css`
7. Copy ALL the contents and paste into the **Custom CSS** text box
8. Click **Save** at the bottom

✅ **Done!** Your checkout pages now have BeautyCita styling.

---

### Step 2: Upload Backend Theme (Admin Dashboard)

1. While still logged in, click your **username** in the top right
2. Select **Server Settings** from the dropdown
3. Go to the **Branding** tab
4. Scroll to **Custom CSS (Server-wide)** section
5. Open the file: `beautycita-backend.css`
6. Copy ALL the contents and paste into the **Custom CSS** text box
7. Click **Save**

✅ **Done!** Your admin dashboard now has BeautyCita styling.

---

## 🎯 What You Get

### Brand Colors
- **Pink**: `#ec4899` 🌸
- **Purple**: `#9333ea` 💜
- **Gradient**: Pink to Purple gradient throughout

### Design Features
- ✨ Pill-shaped buttons matching your main site
- 🎨 Pink-to-purple gradient accents
- 🔘 Rounded corners on cards and modals
- 💅 Playfair Display fonts for headings
- 📱 Mobile-responsive design
- 🌙 Dark mode support

---

## 🔍 Quick Preview

After uploading, you can test:

**Checkout Page:**
- Create a test invoice
- View the payment page
- Should see pink/purple branding with pill buttons

**Backend:**
- Refresh your dashboard
- Navigation should have gradient styling
- Buttons should be pill-shaped
- Cards should have pink borders

---

## 🔧 Troubleshooting

**CSS Not Showing?**
1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Make sure you clicked "Save" after pasting
3. Check that you pasted into the correct CSS field

**Backend Theme Not Available?**
- You need **server admin** permissions to set server-wide CSS
- If you don't see "Server Settings", contact your BTCPay admin

**Want to Customize?**
- Edit the CSS files in: `/var/www/beautycita.com/btcpay-customization/`
- Search for color codes (e.g., `#ec4899`) to change colors
- Re-upload after making changes

---

## 📍 File Locations

Your theme files are located at:
- `/var/www/beautycita.com/btcpay-customization/beautycita-checkout.css`
- `/var/www/beautycita.com/btcpay-customization/beautycita-backend.css`

---

## 🆘 Need Help?

If you encounter issues:
1. Check BTCPay Server is running: `docker ps | grep btcpay`
2. Access BTCPay at: https://beautycita.com/btcpay/
3. Make sure you're logged in as admin

Your BTCPay Server details:
- **URL**: https://beautycita.com/btcpay/
- **Network**: Testnet (for testing before mainnet)
- **Store ID**: 7GRgSP35W6W9WDnNRjmjKs2ct91yxSM9pzJ8D4Wkcq1D

---

**🎉 Enjoy your beautifully branded BTCPay Server!**
