# Google One Tap Authentication - Testing Guide

**Date:** 2025-01-11
**Version:** 1.0
**Status:** Ready for Testing

---

## 🎯 Pre-Testing Setup

### 1. Database Migration

Run the database migration to add required columns:

```bash
# Connect to PostgreSQL
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita

# Run migration
\i backend/migrations/add_google_one_tap_and_client_onboarding.sql

# Verify columns exist
\d users
\d clients
```

Expected output:
```
users table should have:
  - onboarding_completed (boolean)
  - onboarding_completed_at (timestamp)

clients table should have:
  - location_city (varchar)
  - location_state (varchar)
  - location_zip (varchar)
  - service_preferences (jsonb)
```

### 2. Environment Variables

**Backend `.env`:**
```bash
GOOGLE_CLIENT_ID=925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your_secret>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

**Frontend `.env`:**
```bash
VITE_GOOGLE_CLIENT_ID=925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com
VITE_API_URL=http://localhost:4000
```

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services → Credentials**
4. Edit OAuth 2.0 Client ID
5. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://beautycita.com`
6. Add Authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback`
   - `https://beautycita.com/api/auth/google/callback`

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend
npm start
# or
pm2 start ecosystem.config.js

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Monitor logs
pm2 logs beautycita-api --lines 50
```

---

## 🧪 Test Cases

### Test 1: HomePage - Auto Popup for New Visitors

**Scenario:** First-time visitor sees Google One Tap automatically

**Steps:**
1. Open incognito/private browser window
2. Navigate to `http://localhost:5173`
3. Wait 3 seconds

**Expected Result:**
- ✅ Google One Tap popup appears in top-right corner
- ✅ Shows "Sign in with Google" with user's Google accounts
- ✅ Popup doesn't appear again in same session (sessionStorage check)

**Screenshot Location:** Top-right corner overlay

---

### Test 2: Google One Tap - New User Registration

**Scenario:** User clicks Google account in One Tap popup

**Steps:**
1. Open incognito window
2. Wait for Google One Tap popup
3. Click on your Google account
4. Allow permissions

**Expected Result:**
- ✅ Account created in database
- ✅ User redirected to `/onboarding/client`
- ✅ Onboarding wizard shows Step 1 (Location)
- ✅ Database check:
  ```sql
  SELECT id, email, provider, role, onboarding_completed
  FROM users
  WHERE provider = 'google'
  ORDER BY created_at DESC LIMIT 1;
  ```
  Should show: `provider='google'`, `onboarding_completed=false`

**Login History Check:**
```sql
SELECT * FROM login_history
WHERE login_method = 'GOOGLE_ONE_TAP'
ORDER BY created_at DESC LIMIT 1;
```
Should show successful login with method `GOOGLE_ONE_TAP`.

---

### Test 3: Client Onboarding - Step 1 (Location)

**Scenario:** User completes location step

**Steps:**
1. On onboarding Step 1
2. Click "Use My Current Location" (allow browser permission)
   - **OR** manually enter:
     - City: Los Angeles
     - State: CA
     - ZIP: 90001
3. Click "Continue"

**Expected Result:**
- ✅ Progress bar shows 33%
- ✅ Advances to Step 2 (Service Preferences)
- ✅ Form validation works (try submitting empty)

---

### Test 4: Client Onboarding - Step 2 (Services)

**Scenario:** User selects service preferences

**Steps:**
1. On Step 2
2. Click at least 2 services (e.g., Haircut, Makeup)
3. Notice selected services have checkmarks
4. Click "Continue"

**Expected Result:**
- ✅ Progress bar shows 66%
- ✅ Advances to Step 3 (Profile Picture)
- ✅ Counter shows "X services selected"
- ✅ Can't continue without selecting at least 1 service

---

### Test 5: Client Onboarding - Step 3 (Profile Picture)

**Scenario:** User uploads profile picture (optional)

**Steps:**
1. On Step 3
2. Option A: Click "Upload Photo" and select image (max 5MB)
   - **OR** Option B: Click "Complete Setup" to skip
3. Click "Complete Setup"

**Expected Result:**
- ✅ If uploaded: Preview shows image with remove button
- ✅ Success toast: "Welcome to BeautyCita! 🎉"
- ✅ Redirected to `/dashboard`
- ✅ Database check:
  ```sql
  SELECT u.id, u.email, u.onboarding_completed,
         c.location_city, c.location_state, c.service_preferences
  FROM users u
  JOIN clients c ON c.user_id = u.id
  WHERE u.email = 'your-google-email@gmail.com';
  ```
  Should show:
  - `onboarding_completed=true`
  - `location_city` filled
  - `service_preferences` JSON array

---

### Test 6: Google One Tap - Returning User

**Scenario:** User who previously signed up returns

**Steps:**
1. Clear localStorage and sessionStorage
2. Close browser (or use new incognito window)
3. Navigate to `http://localhost:5173`
4. Google One Tap appears
5. Click account

**Expected Result:**
- ✅ Logs in instantly (no registration)
- ✅ Redirected to `/dashboard` (not onboarding)
- ✅ User sees their saved data

---

### Test 7: AuthModal - Manual Trigger

**Scenario:** User clicks "Sign Up" button on homepage

**Steps:**
1. Navigate to homepage
2. Click "Get Started" or "Sign Up"
3. AuthModal opens

**Expected Result:**
- ✅ Modal shows with 3 auth options:
  1. "Continue with Google" button
  2. "or" divider
  3. "Continue with Email" button
- ✅ Clicking Google button opens OAuth flow
- ✅ Clicking Email shows Formik form

---

### Test 8: AuthModal - Email/Password Registration

**Scenario:** User registers with email/password

**Steps:**
1. Open AuthModal
2. Click "Continue with Email"
3. Fill form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Password: Test1234!
   - Confirm Password: Test1234!
   - Accept Terms: ✓
4. Click "Create Account"

**Expected Result:**
- ✅ Validation works (try invalid email, weak password)
- ✅ Account created
- ✅ Auto-login after registration
- ✅ Redirected to `/onboarding/client`

---

### Test 9: Login Page - Google One Tap

**Scenario:** User visits login page directly

**Steps:**
1. Navigate to `http://localhost:5173/login`
2. Wait for page load

**Expected Result:**
- ✅ Google One Tap popup appears automatically
- ✅ Traditional login form also visible below
- ✅ Can use either method

---

### Test 10: Mobile Responsiveness

**Scenario:** Test on mobile devices/emulation

**Steps:**
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 Pro
4. Test all flows:
   - HomePage auth modal
   - Google One Tap
   - Onboarding wizard

**Expected Result:**
- ✅ All buttons 48px+ (WCAG compliant)
- ✅ Touch-friendly spacing
- ✅ Text readable on small screens
- ✅ Forms don't overflow
- ✅ Service cards in 2-column grid on mobile

---

## 🐛 Common Issues & Solutions

### Issue 1: Google One Tap Doesn't Appear

**Symptoms:** Popup doesn't show up

**Debugging:**
1. Open browser console (F12)
2. Check for errors
3. Common causes:
   - Third-party cookies blocked
   - `VITE_GOOGLE_CLIENT_ID` not set
   - Not using HTTPS in production
   - User already signed in (One Tap won't show)

**Solutions:**
```bash
# Check environment variable
echo $VITE_GOOGLE_CLIENT_ID

# Verify in browser console
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)

# Enable cookies in browser settings
```

### Issue 2: "Invalid credential" Error

**Symptoms:** Backend returns 401 Unauthorized

**Debugging:**
```bash
# Check backend logs
pm2 logs beautycita-api | grep "One Tap"

# Verify Google Client ID matches
grep GOOGLE_CLIENT_ID .env
grep VITE_GOOGLE_CLIENT_ID frontend/.env
```

**Solution:** Ensure both client IDs match exactly.

### Issue 3: Onboarding Not Saving

**Symptoms:** Onboarding completes but data not in database

**Debugging:**
```sql
-- Check if endpoint was called
SELECT * FROM login_history
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC;

-- Check client record
SELECT * FROM clients WHERE user_id = YOUR_USER_ID;
```

**Solution:**
- Verify auth token is being sent (`Authorization: Bearer <token>`)
- Check backend logs for errors
- Ensure `/api/onboarding/complete-client` endpoint exists

### Issue 4: Redirect Loop

**Symptoms:** User keeps getting redirected back to onboarding

**Debugging:**
```sql
-- Check onboarding status
SELECT id, email, onboarding_completed
FROM users
WHERE email = 'your-email@gmail.com';
```

**Solution:**
```sql
-- Manually mark as completed (if needed)
UPDATE users
SET onboarding_completed = TRUE,
    onboarding_completed_at = NOW()
WHERE email = 'your-email@gmail.com';
```

---

## 📊 Test Results Template

Copy and fill out:

```markdown
## Test Run: [Date]

**Tester:** [Your Name]
**Environment:** Local / Production
**Browser:** Chrome 120 / Safari 17 / Firefox 121

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1: HomePage Auto Popup | ✅ Pass | Appeared after 3s |
| Test 2: New User Registration | ✅ Pass | Account created |
| Test 3: Onboarding Step 1 | ✅ Pass | Location saved |
| Test 4: Onboarding Step 2 | ✅ Pass | Services selected |
| Test 5: Onboarding Step 3 | ✅ Pass | Completed successfully |
| Test 6: Returning User | ✅ Pass | Logged in instantly |
| Test 7: AuthModal Manual | ✅ Pass | Modal opened |
| Test 8: Email/Password | ✅ Pass | Registration worked |
| Test 9: Login Page One Tap | ✅ Pass | Popup appeared |
| Test 10: Mobile Responsive | ✅ Pass | All flows work |

**Issues Found:** None / [List issues]

**Overall Result:** ✅ All Pass / ⚠️ Minor Issues / ❌ Blocked
```

---

## 🚀 Production Testing

### Pre-Deployment Checklist

- [ ] Database migration run successfully
- [ ] `.env` files configured (no test keys)
- [ ] Google OAuth authorized origins include production domain
- [ ] Frontend built: `npm run build`
- [ ] Backend restarted: `pm2 restart beautycita-api`
- [ ] SSL certificate valid (HTTPS required for One Tap)

### Production Smoke Tests

1. **Visit homepage** → One Tap appears
2. **Sign up new user** → Account created
3. **Complete onboarding** → Dashboard loads
4. **Check database** → Data saved correctly
5. **Monitor logs** → No errors

```bash
# Watch production logs
pm2 logs beautycita-api --lines 100

# Check for One Tap activity
pm2 logs beautycita-api | grep "One Tap"
```

---

## 📈 Success Metrics

Track these metrics to measure One Tap success:

```sql
-- Total Google One Tap signups
SELECT COUNT(*) as one_tap_signups
FROM login_history
WHERE login_method = 'GOOGLE_ONE_TAP'
  AND created_at > NOW() - INTERVAL '7 days';

-- Conversion rate (signups to onboarding completion)
SELECT
  (SELECT COUNT(*) FROM users WHERE onboarding_completed = TRUE
   AND created_at > NOW() - INTERVAL '7 days') * 100.0 /
  NULLIF((SELECT COUNT(*) FROM users
   WHERE created_at > NOW() - INTERVAL '7 days'), 0) as conversion_rate;

-- Average time to complete onboarding
SELECT
  AVG(EXTRACT(EPOCH FROM (onboarding_completed_at - created_at))) / 60 as avg_minutes
FROM users
WHERE onboarding_completed = TRUE
  AND onboarding_completed_at IS NOT NULL;
```

---

## ✅ Sign-Off

**Tested By:** _______________
**Date:** _______________
**Approved for Production:** YES / NO
**Notes:** _______________

---

**Ready for deployment!** 🚀
