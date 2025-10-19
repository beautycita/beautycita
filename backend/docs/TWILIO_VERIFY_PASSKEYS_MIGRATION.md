# Twilio Verify Passkeys Migration Plan

## Goal
Replace current dual-system (SMS verification + custom WebAuthn) with **Twilio Verify Passkeys** unified authentication.

## Current System (To Be Replaced)

### 1. Phone Verification
- Custom code generation in `smsService.js`
- Database table: `user_phone_verification`
- 6-digit codes, 10-minute expiry
- Manual Twilio SMS API calls

### 2. Biometric Authentication
- Custom WebAuthn implementation in `/backend/src/routes/webauthn.js`
- Database table: `webauthn_credentials`
- Manual challenge generation
- Manual credential storage

**Problem:** Two separate systems, more code to maintain, complex registration flow

---

## New System: Twilio Verify Passkeys

### Unified Registration Flow

```
1. User enters phone number
   ↓
2. Call Twilio Verify API → Creates verification + passkey challenge
   ↓
3. User receives SMS code
   ↓
4. User enters code + uses biometric (Face ID/Touch ID/Windows Hello)
   ↓
5. Twilio Verify handles BOTH verifications
   ↓
6. User registered with verified phone + biometric
```

### API Flow

#### Step 1: Create Verification (Phone + Passkey)
```javascript
POST https://verify.twilio.com/v2/Services/{VERIFY_SERVICE_SID}/Verifications
Body: {
  "To": "+17205551234",
  "Channel": "sms",
  "PasskeyEnabled": true,
  "PasskeyFriendlyName": "My iPhone",
  "PasskeyAuthenticatorAttachment": "platform" // For device biometrics
}

Response: {
  "sid": "VE...",
  "challenge": "base64_challenge_for_webauthn",
  "rpId": "beautycita.com",
  "userId": "base64_user_id"
}
```

#### Step 2: User Creates Passkey in Browser
```javascript
// Frontend: Use WebAuthn API with Twilio's challenge
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: base64ToArrayBuffer(twilioChallenge),
    rp: { id: "beautycita.com", name: "BeautyCita" },
    user: {
      id: base64ToArrayBuffer(twilioUserId),
      name: userEmail,
      displayName: userName
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Device biometric
      userVerification: "required",
      residentKey: "required"
    }
  }
});
```

#### Step 3: Verify Phone Code + Passkey
```javascript
POST https://verify.twilio.com/v2/Services/{VERIFY_SERVICE_SID}/VerificationCheck
Body: {
  "To": "+17205551234",
  "Code": "123456", // SMS code user entered
  "PasskeyCredential": JSON.stringify(credential) // WebAuthn credential
}

Response: {
  "status": "approved",
  "valid": true,
  "passkey_sid": "PK..." // Twilio stored the passkey
}
```

#### Step 4: Login (Future)
```javascript
// 1. Request challenge
POST /v2/Services/{SID}/Authentications
Response: { "challenge": "..." }

// 2. User uses biometric
const assertion = await navigator.credentials.get({...});

// 3. Verify
POST /v2/Services/{SID}/AuthenticationCheck
Body: { "PasskeyAssertion": assertion }
```

---

## Implementation Plan

### Phase 1: Setup (Need Auth Token First)
```bash
# Environment variables needed:
TWILIO_ACCOUNT_SID=ACfe65a7cd9e2f4f468544c56824e9cdd6
TWILIO_AUTH_TOKEN=<NEEDED>
TWILIO_VERIFY_SERVICE_SID=VAfca5457ebb5f7de29dc5fe01c1f6f3c8
```

### Phase 2: Backend Changes

#### New File: `/backend/src/twilioVerifyPasskeys.js`
```javascript
const twilio = require('twilio');

class TwilioVerifyPasskeys {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  }

  async startRegistration(phoneNumber, userEmail, userName) {
    const verification = await this.client.verify.v2
      .services(this.serviceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms',
        // Passkey parameters
        passkeyEnabled: true,
        passkeyFriendlyName: 'BeautyCita Device',
        passkeyAuthenticatorAttachment: 'platform'
      });

    return {
      verificationSid: verification.sid,
      challenge: verification.passkey.challenge,
      rpId: verification.passkey.rpId,
      userId: verification.passkey.userId
    };
  }

  async verifyRegistration(phoneNumber, smsCode, passkeyCredential) {
    const check = await this.client.verify.v2
      .services(this.serviceSid)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: smsCode,
        passkeyCredential: JSON.stringify(passkeyCredential)
      });

    return {
      verified: check.status === 'approved',
      passkeySid: check.passkey?.sid
    };
  }
}
```

#### Modified: `/backend/src/authRoutes.js`
```javascript
// OLD: POST /api/auth/register/stylist
// NEW: Simplified registration

router.post('/register/stylist', async (req, res) => {
  const { phoneNumber, email, firstName, businessName } = req.body;

  // 1. Start Twilio Verify (sends SMS + creates passkey challenge)
  const verifyService = new TwilioVerifyPasskeys();
  const registration = await verifyService.startRegistration(
    phoneNumber,
    email,
    firstName
  );

  // 2. Return challenge to frontend
  res.json({
    verificationSid: registration.verificationSid,
    passkeyChallenge: registration.challenge,
    rpId: registration.rpId,
    userId: registration.userId
  });
});

// Separate endpoint to complete registration
router.post('/register/verify', async (req, res) => {
  const { phoneNumber, smsCode, passkeyCredential, userData } = req.body;

  // Verify both phone + passkey with Twilio
  const verifyService = new TwilioVerifyPasskeys();
  const result = await verifyService.verifyRegistration(
    phoneNumber,
    smsCode,
    passkeyCredential
  );

  if (result.verified) {
    // Create user in database
    const user = await createUser({
      ...userData,
      phone: phoneNumber,
      phone_verified: true,
      twilio_passkey_sid: result.passkeySid
    });

    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: 'Verification failed' });
  }
});
```

### Phase 3: Frontend Changes

#### Modified: `/frontend/src/pages/auth/UnifiedAuthPage.tsx`
```typescript
const handleRegistration = async () => {
  // 1. Start registration (sends SMS + gets passkey challenge)
  const response = await axios.post('/api/auth/register/stylist', {
    phoneNumber,
    email,
    firstName,
    businessName
  });

  const { verificationSid, passkeyChallenge, rpId, userId } = response.data;

  // 2. Prompt user for SMS code
  const smsCode = await promptUserForCode();

  // 3. Create passkey using biometric
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: base64ToArrayBuffer(passkeyChallenge),
      rp: { id: rpId, name: "BeautyCita" },
      user: {
        id: base64ToArrayBuffer(userId),
        name: email,
        displayName: firstName
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required"
      }
    }
  });

  // 4. Verify both SMS code + passkey
  const verifyResponse = await axios.post('/api/auth/register/verify', {
    phoneNumber,
    smsCode,
    passkeyCredential: credential,
    userData: { email, firstName, businessName, role: 'STYLIST' }
  });

  if (verifyResponse.data.success) {
    // Registration complete!
    navigate('/dashboard');
  }
};
```

### Phase 4: Database Changes

#### New Migration: Add Twilio Passkey SID
```sql
ALTER TABLE users
ADD COLUMN twilio_passkey_sid VARCHAR(255),
ADD COLUMN twilio_verify_enabled BOOLEAN DEFAULT false;

-- Mark old webauthn_credentials as legacy
ALTER TABLE webauthn_credentials
ADD COLUMN legacy BOOLEAN DEFAULT true;
```

### Phase 5: Cleanup (After Migration)

#### Remove Old Code:
- ❌ `/backend/src/routes/webauthn.js` (replaced by Twilio)
- ❌ Custom verification code logic in `smsService.js`
- ❌ Table: `user_phone_verification` (Twilio handles this)
- ❌ Table: `webauthn_credentials` (Twilio stores passkeys)

---

## Benefits

### Before (Current System):
```
Phone Verification:
- Custom code generation
- Database storage
- Manual SMS sending
- Separate verification table
- 200+ lines of code

Biometric Auth:
- Custom WebAuthn implementation
- Challenge generation
- Credential storage
- 400+ lines of code

Total: 600+ lines of complex code
```

### After (Twilio Verify Passkeys):
```
Unified System:
- Twilio handles everything
- Single API call for registration
- Single API call for verification
- Passkeys stored on Twilio
- Phone verified by Twilio

Total: ~100 lines of code
```

### Cost Savings:
- ✅ Less code to maintain
- ✅ Built-in backup/recovery
- ✅ Cross-device passkey sync
- ✅ Professional SMS delivery
- ✅ Unified user experience

---

## Next Steps

1. **Get Auth Token** - Required to use Twilio Verify API
2. **Test in Development** - Create test registration flow
3. **Migrate Existing Users** - Plan for users with old credentials
4. **Deploy to Production** - Switch to Twilio Verify Passkeys
5. **Remove Legacy Code** - Clean up old WebAuthn implementation

---

## Twilio Verify Pricing

- **SMS Verification**: ~$0.05 per verification
- **Passkey Storage**: Free (included with Verify)
- **No per-user fees**: Only pay for verifications sent

Estimated cost: ~$0.05 per user registration (one-time)
