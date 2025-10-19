# Twilio Verify Passkeys Setup Guide

## Current Status
- ✅ Verify Service SID: `VAfca5457ebb5f7de29dc5fe01c1f6f3c8`
- ❓ Passkeys enabled: Unknown (need to check/enable)

---

## Option 1: Enable Passkeys via Twilio Console (Easiest)

### Step 1: Navigate to Verify Service
1. Go to: https://console.twilio.com/us1/develop/verify/services
2. Find your service (SID: `VAfca5457ebb5f7de29dc5fe01c1f6f3c8`)
3. Click on the service to open settings

### Step 2: Enable Passkeys (If Available in UI)
**Location in Console:**
- Look for "Passkeys" or "Authentication Methods" section
- Toggle "Enable Passkeys" ON
- Configure passkey settings:
  - **Relying Party ID**: `beautycita.com`
  - **Relying Party Name**: `BeautyCita`
  - **Allowed Origins**: `https://beautycita.com`
  - **Authenticator Attachment**: `platform` (for device biometrics)
  - **User Verification**: `required`

**⚠️ NOTE:** Passkeys are in **Private Beta** - you may not see this option in the UI yet.

If you don't see passkey options in the console, use Option 2 (API).

---

## Option 2: Enable Passkeys via API (If Not in Console)

### Prerequisites
- Auth Token (still needed)
- Twilio CLI installed OR cURL/Postman

### Method A: Using Twilio CLI

```bash
# Install Twilio CLI (if not installed)
npm install -g twilio-cli

# Login
twilio login

# Update existing service to enable passkeys
twilio api:verify:v2:services:update \
  --sid VAfca5457ebb5f7de29dc5fe01c1f6f3c8 \
  --passkey-enabled \
  --passkey-relying-party-id beautycita.com \
  --passkey-relying-party-name BeautyCita \
  --passkey-allowed-origins "https://beautycita.com" \
  --passkey-authenticator-attachment platform \
  --passkey-user-verification required
```

### Method B: Using cURL (With Auth Token)

```bash
curl -X POST "https://verify.twilio.com/v2/Services/VAfca5457ebb5f7de29dc5fe01c1f6f3c8" \
  -u "ACfe65a7cd9e2f4f468544c56824e9cdd6:YOUR_AUTH_TOKEN" \
  -d "PasskeyEnabled=true" \
  -d "PasskeyRelyingPartyId=beautycita.com" \
  -d "PasskeyRelyingPartyName=BeautyCita" \
  -d "PasskeyAllowedOrigins=https://beautycita.com" \
  -d "PasskeyAuthenticatorAttachment=platform" \
  -d "PasskeyUserVerification=required"
```

### Method C: Using Node.js Script

```javascript
const twilio = require('twilio');

const client = twilio(
  'ACfe65a7cd9e2f4f468544c56824e9cdd6',
  'YOUR_AUTH_TOKEN'
);

async function enablePasskeys() {
  const service = await client.verify.v2
    .services('VAfca5457ebb5f7de29dc5fe01c1f6f3c8')
    .update({
      passkeyEnabled: true,
      passkeyRelyingPartyId: 'beautycita.com',
      passkeyRelyingPartyName: 'BeautyCita',
      passkeyAllowedOrigins: ['https://beautycita.com'],
      passkeyAuthenticatorAttachment: 'platform',
      passkeyUserVerification: 'required'
    });

  console.log('Passkeys enabled!', service);
}

enablePasskeys();
```

---

## Option 3: Create New Passkey-Enabled Service

If you want to create a completely new service with passkeys from the start:

### Via API:
```bash
curl -X POST "https://verify.twilio.com/v2/Services" \
  -u "ACfe65a7cd9e2f4f468544c56824e9cdd6:YOUR_AUTH_TOKEN" \
  -d "FriendlyName=BeautyCita Passkey Auth" \
  -d "PasskeyEnabled=true" \
  -d "PasskeyRelyingPartyId=beautycita.com" \
  -d "PasskeyRelyingPartyName=BeautyCita" \
  -d "PasskeyAllowedOrigins=https://beautycita.com" \
  -d "PasskeyAuthenticatorAttachment=platform" \
  -d "PasskeyUserVerification=required"
```

This will return a new Service SID like: `VA...`

---

## How to Check if Passkeys are Enabled

### Method 1: Via API
```bash
curl "https://verify.twilio.com/v2/Services/VAfca5457ebb5f7de29dc5fe01c1f6f3c8" \
  -u "ACfe65a7cd9e2f4f468544c56824e9cdd6:YOUR_AUTH_TOKEN"
```

Look for:
```json
{
  "sid": "VAfca5457ebb5f7de29dc5fe01c1f6f3c8",
  "passkey_enabled": true,
  "passkey_relying_party_id": "beautycita.com",
  ...
}
```

### Method 2: Try Creating a Verification
If passkeys are enabled, this endpoint will work:
```bash
POST https://verify.twilio.com/v2/Services/VAfca5457ebb5f7de29dc5fe01c1f6f3c8/Verifications
Body: {
  "To": "+17205551234",
  "Channel": "sms",
  "PasskeyEnabled": true
}
```

If passkeys are NOT enabled, you'll get an error like:
```
"Passkeys are not enabled for this service"
```

---

## Required Configuration Values

```
Relying Party ID:        beautycita.com
Relying Party Name:      BeautyCita
Allowed Origins:         https://beautycita.com
Authenticator Type:      platform (device biometrics)
User Verification:       required (Face ID/Touch ID/Windows Hello)
Discoverable Credentials: preferred (allows passwordless)
```

---

## Private Beta Access

**Important:** Twilio Verify Passkeys is in **Private Beta**

### To Request Access:
1. Go to: https://www.twilio.com/console/verify/passkeys
2. Or contact Twilio Support: https://support.twilio.com
3. Request: "Passkeys Beta Access for Account SID: ACfe65a7cd9e2f4f468544c56824e9cdd6"

### What to Include in Request:
- Account SID: `ACfe65a7cd9e2f4f468544c56824e9cdd6`
- Use case: "Mobile-first beauty booking app requiring phone + biometric authentication"
- Domain: `beautycita.com`
- Expected users: 1000+ stylists and clients

---

## Troubleshooting

### Error: "Passkeys feature not available"
- **Cause:** Account not in Private Beta
- **Solution:** Request beta access from Twilio support

### Error: "Invalid Relying Party ID"
- **Cause:** Domain doesn't match or HTTPS not configured
- **Solution:** Ensure `beautycita.com` is properly configured with SSL

### Error: "Origin not allowed"
- **Cause:** Request coming from different domain
- **Solution:** Add all domains to `PasskeyAllowedOrigins`:
  - `https://beautycita.com`
  - `https://www.beautycita.com`
  - `http://localhost:3000` (for development)

---

## Next Steps After Enabling

1. ✅ Verify passkeys are enabled (check API response)
2. ✅ Test creating verification with `PasskeyEnabled: true`
3. ✅ Implement frontend WebAuthn flow
4. ✅ Test registration with real device biometric
5. ✅ Deploy to production

---

## Alternative: Check Existing Service

**Do you want to:**
1. **Use existing service** (`VAfca5457ebb5f7de29dc5fe01c1f6f3c8`) - Need to enable passkeys on it
2. **Create new service** - Fresh start with passkeys enabled from beginning

**I can help with either once you provide the Auth Token!**
