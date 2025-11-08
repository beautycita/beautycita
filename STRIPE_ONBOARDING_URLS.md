# Stripe Connect Onboarding URLs

**Generated:** November 8, 2025
**Expires:** November 8, 2025 (within 30 minutes)

## Overview

All 3 stylists now have Stripe Connect accounts created. They need to complete onboarding through Stripe's hosted UI by visiting the URLs below.

## ✅ Status

- **Total Stylists:** 4
- **Stripe Accounts Created:** 4/4 (100%)
- **Onboarding Complete:** 1/4 (25%)
- **Pending Onboarding:** 3/4 (75%)

---

## 🔗 Onboarding Links

### 1. Stylist Test (ID: 20)
- **Email:** stylist@example.com
- **Stripe Account:** acct_1SR8al0oxpQ2ZpMC
- **Status:** Pending onboarding
- **Onboarding URL:**
  ```
  https://connect.stripe.com/setup/e/acct_1SR8al0oxpQ2ZpMC/teq0frz6y1FI
  ```

### 2. Google Play Test Salon (ID: 22)
- **Email:** googleplay-stylist@beautycita.com
- **Stripe Account:** acct_1SR8ao03FxsKKsOV
- **Status:** Pending onboarding
- **Onboarding URL:**
  ```
  https://connect.stripe.com/setup/e/acct_1SR8ao03FxsKKsOV/CVZ6Y9vqoYph
  ```

### 3. Maria Rodriguez (ID: 28)
- **Email:** stylist1@beautycita.com
- **Stripe Account:** acct_1SR8ar1AsyXyDEND
- **Status:** Pending onboarding
- **Onboarding URL:**
  ```
  https://connect.stripe.com/setup/e/acct_1SR8ar1AsyXyDEND/5pAxsgZFWY0f
  ```

### 4. Test Beauty Studio (ID: 23) ✅
- **Stripe Account:** acct_test_stylist_001
- **Status:** ✅ **ACTIVE** - Can receive payments

---

## 🎯 Next Steps

### For Testing/Development:
1. Visit each onboarding URL above
2. Complete Stripe's onboarding flow with test data
3. Once complete, stylists will be able to receive payments

### For Production:
1. Send onboarding emails to stylists with their unique URLs
2. Stylists complete onboarding on their own
3. Webhook events will update the database automatically when complete

---

## 📝 Notes

- **URL Expiration:** These Account Links expire in ~30 minutes
- **Regeneration:** Use the `/api/stripe-connect/create-connect-account` endpoint to generate fresh links
- **Test Mode:** These accounts are in Stripe TEST mode
- **Webhooks:** Configure webhook endpoint to auto-update onboarding status

---

## 🔄 Regenerating Expired Links

If the above links expire, stylists can regenerate them by:

1. **Via API:**
   ```bash
   curl -X POST https://beautycita.com/api/stripe-connect/create-connect-account \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json"
   ```

2. **Via Frontend:**
   - Navigate to Stylist Panel → Settings → Payments
   - Click "Complete Stripe Setup"

---

## ✅ Completion Status

The system will automatically update when onboarding is complete via Stripe webhooks:

```sql
-- Check current status
SELECT id, business_name, stripe_account_status, stripe_onboarding_complete
FROM stylists
WHERE stripe_account_id IS NOT NULL
ORDER BY id;
```

Current Status:
- Stylist 20: **Pending** (account created, needs onboarding)
- Stylist 22: **Pending** (account created, needs onboarding)
- Stylist 23: **Active** ✅ (fully operational)
- Stylist 28: **Pending** (account created, needs onboarding)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08 09:43 UTC
