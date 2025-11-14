# Google OAuth 401 Error - Configuration Fix

**Date:** November 14, 2025
**Status:** ⚠️ **REQUIRES GOOGLE CONSOLE CONFIGURATION**

---

## Problem Summary

Users are experiencing 401 authentication errors when trying to sign in with Google One Tap:

```
/api/auth/google/one-tap:1 Failed to load resource: the server responded with a status of 401 ()
Google One Tap error: Error: Authentication failed. Please try again.
```

## Root Cause

The backend Google One Tap endpoint (`/api/auth/google/one-tap`) is correctly implemented, but **Google's OAuth console requires specific domain authorizations** for the client ID to work in production.

---

## Required Configuration in Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select the project containing BeautyCita OAuth credentials
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Find OAuth 2.0 Client ID
Look for the client ID: `925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com`

### Step 3: Configure Authorized Origins
Click on the client ID and add these **Authorized JavaScript origins**:

```
https://beautycita.com
http://localhost:5173
http://localhost:4000
```

### Step 4: Configure Authorized Redirect URIs
Add these **Authorized redirect URIs**:

```
https://beautycita.com/auth/callback
https://beautycita.com/api/auth/google/callback
http://localhost:5173/auth/callback
http://localhost:4000/api/auth/google/callback
```

### Step 5: Additional Scopes (Already Configured)
Verify these scopes are enabled:
- ✅ `https://www.googleapis.com/auth/userinfo.email`
- ✅ `https://www.googleapis.com/auth/userinfo.profile`

### Step 6: OAuth Consent Screen
Ensure the OAuth consent screen is configured:
- **App name:** BeautyCita
- **Support email:** Your email
- **Authorized domains:** `beautycita.com`
- **App logo:** Optional but recommended

---

## Verification Steps

After configuring the Google Cloud Console:

### Test 1: Verify Client ID Matches
```bash
# Frontend
grep VITE_GOOGLE_CLIENT_ID frontend/.env

# Backend
grep GOOGLE_CLIENT_ID .env
```

**Expected:** Both should show `925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com`

### Test 2: Test Google One Tap on Production
1. Open https://beautycita.com/login
2. Wait for Google One Tap popup to appear
3. Click on your Google account
4. Verify successful authentication (redirects to /panel or /onboarding/client)

### Test 3: Check Backend Logs
```bash
ssh beautycita@74.208.218.18
sudo -u www-data pm2 logs beautycita-api | grep "Google One Tap"
```

**Expected Success Logs:**
```
Google One Tap credential verified
Creating new Google One Tap user
Client profile created for new Google One Tap user
Google One Tap authentication successful
```

**Error Logs to Watch For:**
```
Google One Tap verification error: Token used too late
Google One Tap verification error: Invalid token signature
Google One Tap verification error: Audience mismatch
```

---

## Alternative: Create New OAuth Client ID

If the above doesn't work, create a **NEW** OAuth 2.0 Client ID specifically for production:

### Step 1: Create New Client ID
1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. **Application type:** Web application
4. **Name:** BeautyCita Production

### Step 2: Configure Origins and Redirects
**Authorized JavaScript origins:**
```
https://beautycita.com
```

**Authorized redirect URIs:**
```
https://beautycita.com/auth/callback
https://beautycita.com/api/auth/google/callback
```

### Step 3: Update Environment Variables
```bash
# On production server
ssh beautycita@74.208.218.18
cd /var/www/beautycita.com

# Edit backend .env
nano .env
# Update GOOGLE_CLIENT_ID=<new_client_id>
# Update GOOGLE_CLIENT_SECRET=<new_client_secret>

# Edit frontend .env
nano frontend/.env
# Update VITE_GOOGLE_CLIENT_ID=<new_client_id>

# Rebuild frontend
cd frontend
sudo -u www-data npm run build

# Restart backend
sudo -u www-data pm2 restart beautycita-api
```

---

## Current Code Status

### ✅ Backend Implementation (Correct)
File: `backend/src/routes/googleAuth.js` (lines 89-270)

```javascript
router.post('/google/one-tap', async (req, res) => {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const { credential } = req.body;

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // ... create/login user
  } catch (error) {
    // Returns 401 if verification fails
    res.status(401).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
});
```

### ✅ Frontend Implementation (Correct)
File: `frontend/src/pages/auth/GoogleOnlyAuthPage.tsx`

```javascript
window.google.accounts.id.initialize({
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Correct
  callback: handleCredentialResponse,
  auto_select: false,
  cancel_on_tap_outside: false,
  context: 'signin',
  itp_support: true,
});
```

### ✅ Device-Based Routing (New)
File: `frontend/src/App.tsx`

```javascript
// Mobile (< 768px): Google One Tap only
// Desktop (>= 768px): Google One Tap + Email/Password
<Route path="/login" element={
  <DeviceBasedAuth
    mobileComponent={GoogleOnlyAuthPage}
    desktopComponent={LoginPage}
  />
} />
```

---

## Summary

**Code is correct ✅** - The issue is purely a Google Cloud Console configuration problem.

**Action Required:**
1. Configure **Authorized JavaScript origins** in Google Cloud Console
2. Configure **Authorized redirect URIs** in Google Cloud Console
3. Verify OAuth consent screen settings
4. Test authentication on production

**Once configured:** Google One Tap should work immediately without any code changes or redeployment.

---

## References

- **Google Identity Services Documentation:** https://developers.google.com/identity/gsi/web/guides/overview
- **OAuth 2.0 Client Configuration:** https://console.cloud.google.com/apis/credentials
- **BeautyCita Client ID:** `925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com`
