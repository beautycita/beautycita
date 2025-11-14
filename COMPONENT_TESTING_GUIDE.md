# Component Testing Guide

**Purpose:** Test all newly created components before integration
**Created:** November 6, 2025
**Test Page:** `/component-test`

---

## 🚨 IMPORTANT: Components NOT Actually Tested Yet

I created the components with correct logic and TypeScript types, but they have **NOT** been:
- ❌ Compiled/built
- ❌ Run in a browser
- ❌ Tested with real user interactions
- ❌ Verified against backend APIs
- ❌ Checked for runtime errors

**You need to test them yourself before using in production!**

---

## How to Test

### 1. Add the Test Route

**File:** `frontend/src/App.tsx` (or your router file)

```typescript
import ComponentTestPage from './pages/ComponentTestPage';

// Add to your routes
<Route path="/component-test" element={<ComponentTestPage />} />
```

### 2. Start the Development Server

```bash
cd frontend
npm install  # Install dependencies first
npm run dev  # Start dev server
```

### 3. Access the Test Page

Navigate to: `http://localhost:5173/component-test`

---

## Components to Test

### 1. ✅ MultiStepWizard

**What to Test:**
- [ ] Progress indicator shows correctly
- [ ] Can navigate forward with "Next" button
- [ ] Can navigate backward with "Back" button
- [ ] Step validation works (async validation test in step 2)
- [ ] Can click on completed steps to jump back
- [ ] Cannot click on future steps
- [ ] "Complete" button shows on last step
- [ ] Optional steps can be skipped
- [ ] Animations work smoothly
- [ ] Step counter shows correct numbers

**Expected Behavior:**
- 3 steps with colored backgrounds
- Step 2 has 1-second validation delay
- Step 3 is marked as optional
- Clicking "Complete" shows an alert

**Potential Issues to Watch:**
- Animation glitches when changing steps
- Validation not blocking navigation
- Progress bar not updating
- Step clicks not working

---

### 2. 📱 PhoneVerification

**What to Test:**

**Step 1: Phone Entry**
- [ ] Input only accepts numbers
- [ ] Automatically formats to 10 digits
- [ ] "Send Code" button disabled until 10 digits entered
- [ ] Shows validation error for invalid phone
- [ ] Loading spinner shows when sending
- [ ] Error message displays if API fails

**Step 2: Code Verification**
- [ ] 6 code input boxes appear
- [ ] Auto-focus on first box
- [ ] Typing auto-advances to next box
- [ ] Backspace goes to previous box
- [ ] Pasting 6-digit code fills all boxes
- [ ] "Verify" button disabled until all boxes filled
- [ ] Resend button has 60-second cooldown
- [ ] Success checkmark shows when verified

**Backend Requirements:**
```bash
# Backend must be running with these endpoints:
POST /api/twilio-verify/send-code
POST /api/twilio-verify/verify-code

# Twilio account must have credits
```

**Test Cases:**

**✅ Success Case:**
1. Enter your real phone number (10 digits)
2. Click "Send Verification Code"
3. Check your phone for SMS
4. Enter 6-digit code
5. Should see success checkmark
6. Should call `onVerified` callback

**❌ Error Cases:**
1. Invalid phone (wrong number of digits)
2. Invalid verification code
3. Expired code (wait 5+ minutes)
4. No Twilio credits

**Potential Issues:**
- Code boxes not auto-focusing
- Paste not working
- Resend cooldown not counting down
- API errors not displaying

---

### 3. 🔔 SMSConsent

**What to Test:**
- [ ] All 7 checkboxes render
- [ ] Checkboxes toggle on/off
- [ ] "Select All" enables all
- [ ] "Select None" disables all
- [ ] "Select Recommended" enables 6 (not marketing)
- [ ] Counter updates (e.g., "6 of 7 enabled")
- [ ] "Save Preferences" button works
- [ ] "Skip for Now" button works
- [ ] Grouped by category (Essential, Helpful, Optional)
- [ ] Recommended badges show correctly

**Backend Requirements:**
```bash
POST /api/sms-preferences
```

**Test Cases:**

**✅ Success Case:**
1. Toggle some checkboxes
2. Click "Save Preferences"
3. Should see success toast
4. Check browser console for saved preferences object
5. Should call `onSave` callback with preferences

**Potential Issues:**
- Checkboxes not toggling
- Quick actions not working
- Counter not updating
- API call failing

---

### 4. ❤️ FavoriteButton

**What to Test:**
- [ ] Small, medium, large sizes render correctly
- [ ] Heart icon shows (outline when not favorited)
- [ ] Heart fills when favorited (solid icon)
- [ ] Click toggles favorite status
- [ ] Scale animation plays on click
- [ ] Toast notification shows
- [ ] Works in a card layout
- [ ] Shows label when `showLabel={true}`
- [ ] Redirects to login if not authenticated

**Backend Requirements:**
```bash
# User must be logged in
GET /api/favorites
POST /api/favorites/:stylistId
DELETE /api/favorites/:stylistId
```

**Test Cases:**

**✅ Success Case (Logged In):**
1. Click heart icon
2. Should see scale animation
3. Icon should change from outline to filled
4. Should see "Added to favorites" toast
5. Click again to unfavorite
6. Icon should change back to outline
7. Should see "Removed from favorites" toast

**❌ Not Logged In:**
1. Click heart icon
2. Should redirect to /login
3. Should see "Please login" toast

**Potential Issues:**
- Icon not changing
- Animation not playing
- Favorites not persisting
- API errors

---

### 5. 🧩 Integrated Wizard

**What to Test:**
- [ ] All components work together
- [ ] Data flows between steps
- [ ] Phone verification completes before moving to SMS
- [ ] SMS preferences save correctly
- [ ] Summary shows correct data
- [ ] Full flow completes successfully

**Test Cases:**

**✅ Full Flow:**
1. Start wizard
2. Click through intro step
3. Verify phone number (real SMS)
4. Set SMS preferences
5. See summary with your data
6. Complete wizard
7. Check console for results

---

## How to Run Tests

### Option 1: Manual Testing (Recommended)

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173/component-test`
3. Click each test in the sidebar
4. Follow the test checklist above
5. Note any issues

### Option 2: Production Build Test

1. Build frontend: `npm run build`
2. Check for TypeScript errors
3. Deploy to staging
4. Test on actual domain

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/components/...'"

**Solution:** Check your TypeScript path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "apiClient is not defined"

**Solution:** Make sure `apiClient` is exported in `frontend/src/services/api.ts`

### Issue: Phone verification sends but never verifies

**Solution:**
1. Check Twilio account has credits
2. Verify phone number is correct format
3. Check backend logs for errors
4. Try different phone number

### Issue: Favorites not working

**Solution:**
1. Make sure you're logged in
2. Check `authStore` has valid user
3. Verify JWT token in localStorage
4. Check backend `/api/favorites` routes are mounted

### Issue: Build fails with missing dependencies

**Solution:**
```bash
cd frontend
rm -rf node_modules
npm install
```

---

## Backend Requirements Checklist

Before testing, ensure backend has:

- [x] Twilio Verify configured (`TWILIO_VERIFY_SERVICE_SID`)
- [x] Twilio Auth Token (`TWILIO_AUTH_TOKEN`)
- [x] SMS Preferences routes mounted (`/api/sms-preferences`)
- [x] Phone verification routes (`/api/twilio-verify/*`)
- [x] Favorites routes (`/api/favorites`)
- [x] Backend running on port 4000
- [x] Database connected
- [x] Redis connected

**Check backend status:**
```bash
curl https://beautycita.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Expected Test Results

### ✅ All Tests Passing

- All components render without errors
- Interactions work as expected
- API calls succeed
- Data persists correctly
- Animations are smooth
- No console errors

### ❌ Tests Failing

**If tests fail:**
1. Note the specific error
2. Check browser console for errors
3. Check network tab for failed API calls
4. Check component file for typos
5. Verify backend is running
6. Check TypeScript compilation errors

---

## Reporting Issues

If you find issues, note:

1. **Component name**
2. **What you did** (steps to reproduce)
3. **What happened** (actual behavior)
4. **What you expected** (expected behavior)
5. **Error messages** (console errors, network errors)
6. **Browser** (Chrome, Safari, Firefox)

**Example:**
```
Component: PhoneVerification
Steps: 1. Entered phone number 2. Clicked "Send Code"
Actual: Nothing happened
Expected: Should see loading spinner and receive SMS
Errors: Console shows "apiClient is not defined"
Browser: Chrome 120
```

---

## Next Steps After Testing

### If All Tests Pass ✅

1. Add route to main app
2. Integrate components into actual pages
3. Add to production build
4. Deploy to staging
5. Test on staging
6. Deploy to production

### If Tests Fail ❌

1. Document all failures
2. Fix errors one by one
3. Re-test after each fix
4. Don't integrate until all tests pass

---

## Files to Test

| File | Lines | Purpose |
|------|-------|---------|
| `MultiStepWizard.tsx` | 300 | Reusable wizard component |
| `PhoneVerification.tsx` | 400 | Phone verification with Twilio |
| `SMSConsent.tsx` | 400 | SMS notification preferences |
| `FavoriteButton.tsx` | 200 | Favorite toggle button |
| `usePageMeta.ts` | 100 | SEO metadata hook |
| `useFavorites.ts` | 150 | Favorites management hook |
| `favoritesService.ts` | 100 | Favorites API service |
| `pageMeta.ts` | 200 | Page metadata configs |
| `ComponentTestPage.tsx` | 400 | This test page |

**Total:** ~2,250 lines to test

---

## Test Completion Checklist

- [ ] Built frontend successfully (no TypeScript errors)
- [ ] Accessed test page at `/component-test`
- [ ] Tested MultiStepWizard (all navigation works)
- [ ] Tested PhoneVerification (received SMS and verified)
- [ ] Tested SMSConsent (saved preferences to backend)
- [ ] Tested FavoriteButton (toggled favorite)
- [ ] Tested Integrated Wizard (full flow completed)
- [ ] Checked browser console (no errors)
- [ ] Checked network tab (API calls succeeding)
- [ ] Tested on mobile viewport
- [ ] Tested while logged out
- [ ] Tested while logged in
- [ ] All animations smooth
- [ ] All error states handled
- [ ] Ready to integrate ✅

---

**Important:** Do NOT integrate these components into production until you've completed this testing checklist!
