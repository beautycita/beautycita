# BeautyCita Mobile App - Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APP STARTS                                      │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │  SplashScreen    │                                │
│                         │  (Checking auth) │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                    ┌─────────────┴─────────────┐                            │
│                    ▼                           ▼                            │
│            ┌──────────────┐            ┌──────────────┐                     │
│            │ isLoading?   │            │Session found?│                     │
│            │     YES      │            │     YES      │                     │
│            └──────────────┘            └──────────────┘                     │
│                    │                           │                            │
│                    │                           ▼                            │
│                    │                  ┌──────────────────┐                  │
│                    │                  │   Verify Token   │                  │
│                    │                  │  (GET /auth/me)  │                  │
│                    │                  └──────────────────┘                  │
│                    │                           │                            │
│                    │              ┌────────────┴────────────┐               │
│                    │              ▼                         ▼               │
│                    │        ┌──────────┐            ┌──────────┐            │
│                    │        │  Valid?  │            │ Invalid? │            │
│                    │        │   YES    │            │   YES    │            │
│                    │        └──────────┘            └──────────┘            │
│                    │              │                         │               │
│                    │              ▼                         │               │
│                    │     ┌────────────────┐                │               │
│                    │     │  MAIN APP      │                │               │
│                    │     │  (HomeScreen)  │                │               │
│                    │     └────────────────┘                │               │
│                    │                                        │               │
│                    └────────────────────────────────────────┘               │
│                                     │                                       │
│                                     ▼                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      UNAUTHENTICATED FLOW                                    │
│                                                                              │
│                         ┌──────────────────┐                                │
│                         │  WelcomeScreen   │                                │
│                         │  (3-slide intro) │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                    ┌─────────────┴─────────────┐                            │
│                    │                           │                            │
│                    ▼                           ▼                            │
│         ┌──────────────────┐        ┌──────────────────┐                   │
│         │   LoginScreen    │◄───────│  RegisterScreen  │                   │
│         │                  │        │                  │                   │
│         └──────────────────┘        └──────────────────┘                   │
│                │   │                         │                              │
│                │   │                         ▼                              │
│                │   │              ┌─────────────────────────┐               │
│                │   │              │ PhoneVerificationScreen │               │
│                │   │              │   (6-digit SMS code)    │               │
│                │   │              └─────────────────────────┘               │
│                │   │                         │                              │
│                │   │                         ▼                              │
│                │   │              ┌─────────────────────┐                   │
│                │   │              │ BiometricSetupScreen│                   │
│                │   │              │ (Enable/Skip)       │                   │
│                │   │              └─────────────────────┘                   │
│                │   │                         │                              │
│                │   └─────────────────────────┴──────────┐                   │
│                │                                        │                   │
│                │                                        ▼                   │
│                │                            ┌────────────────────┐          │
│                │                            │     MAIN APP       │          │
│                │                            │   (HomeScreen)     │          │
│                │                            └────────────────────┘          │
│                │                                                            │
│                ▼                                                            │
│     ┌──────────────────────┐                                               │
│     │ PasswordResetScreen  │                                               │
│     │  (Email reset link)  │                                               │
│     └──────────────────────┘                                               │
│                │                                                            │
│                └──────► Back to LoginScreen                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      LOGIN OPTIONS FLOW                                      │
│                                                                              │
│                         ┌──────────────────┐                                │
│                         │  LoginScreen     │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│            ┌─────────────────────┼─────────────────────┐                    │
│            ▼                     ▼                     ▼                    │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐             │
│   │ Email/Password │   │   Biometric    │   │  Google OAuth  │             │
│   │  (Form login)  │   │ (Face/Touch ID)│   │ (Google btn)   │             │
│   └────────────────┘   └────────────────┘   └────────────────┘             │
│            │                     │                     │                    │
│            ▼                     ▼                     ▼                    │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐             │
│   │ POST /auth/    │   │ POST /webauthn/│   │ POST /auth/    │             │
│   │    login       │   │  authenticate  │   │    google      │             │
│   └────────────────┘   └────────────────┘   └────────────────┘             │
│            │                     │                     │                    │
│            └─────────────────────┴─────────────────────┘                    │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ Return JWT Token │                                │
│                         │   Save to        │                                │
│                         │  AsyncStorage    │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │    MAIN APP      │                                │
│                         └──────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW (DETAILED)                             │
│                                                                              │
│                         ┌──────────────────┐                                │
│                         │ RegisterScreen   │                                │
│                         │   STEP 1         │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                    ┌─────────────┴─────────────┐                            │
│                    ▼                           ▼                            │
│         ┌──────────────────┐        ┌──────────────────┐                   │
│         │  Select CLIENT   │        │  Select STYLIST  │                   │
│         │      role        │        │      role        │                   │
│         └──────────────────┘        └──────────────────┘                   │
│                    │                           │                            │
│                    └─────────────┬─────────────┘                            │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ RegisterScreen   │                                │
│                         │   STEP 2         │                                │
│                         │ (Registration    │                                │
│                         │     Form)        │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  │ Fill: Name, Email, Phone,                │
│                                  │ Password, Confirm, Terms                 │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ POST /auth/      │                                │
│                         │    register      │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │  SMS Code Sent   │                                │
│                         │  to Phone        │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │PhoneVerification │                                │
│                         │    Screen        │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                         Enter 6-digit code │                                │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ POST /auth/      │                                │
│                         │  verify-phone    │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ Return JWT Token │                                │
│                         │   & User Data    │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │ BiometricSetup   │                                │
│                         │    Screen        │                                │
│                         └──────────────────┘                                │
│                                  │                                           │
│                    ┌─────────────┴─────────────┐                            │
│                    ▼                           ▼                            │
│         ┌──────────────────┐        ┌──────────────────┐                   │
│         │  Enable Bio-     │        │   Skip for Now   │                   │
│         │  metrics         │        │                  │                   │
│         └──────────────────┘        └──────────────────┘                   │
│                    │                           │                            │
│                    │ Device prompts            │                            │
│                    │ for enrollment            │                            │
│                    ▼                           │                            │
│         ┌──────────────────┐                   │                            │
│         │ POST /webauthn/  │                   │                            │
│         │    register      │                   │                            │
│         └──────────────────┘                   │                            │
│                    │                           │                            │
│                    └─────────────┬─────────────┘                            │
│                                  ▼                                           │
│                         ┌──────────────────┐                                │
│                         │    MAIN APP      │                                │
│                         │   (HomeScreen)   │                                │
│                         └──────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT (AuthContext)                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                      AuthContext                            │             │
│  │                                                              │             │
│  │  State:                                                     │             │
│  │  • user: User | null                                        │             │
│  │  • isAuthenticated: boolean                                 │             │
│  │  • isLoading: boolean                                       │             │
│  │  • token: string | null                                     │             │
│  │                                                              │             │
│  │  Methods:                                                   │             │
│  │  • login(credentials)                                       │             │
│  │  • register(data)                                           │             │
│  │  • verifyPhone(data)                                        │             │
│  │  • resendVerificationCode(phone)                            │             │
│  │  • biometricLogin()                                         │             │
│  │  • googleSignIn()                                           │             │
│  │  • logout()                                                 │             │
│  │  • setupBiometrics()                                        │             │
│  │  • checkBiometricAvailability()                             │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                      AsyncStorage                           │             │
│  │                                                              │             │
│  │  Keys:                                                      │             │
│  │  • @beautycita:token    → JWT token                         │             │
│  │  • @beautycita:user     → User JSON                         │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                      API Service                            │             │
│  │                                                              │             │
│  │  • Axios instance with 30s timeout                          │             │
│  │  • Auto-inject JWT token in Authorization header            │             │
│  │  • Handle 401 errors (auto-logout)                          │             │
│  │  • Format errors consistently                               │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                  Backend API Endpoints                      │             │
│  │                                                              │             │
│  │  Development:  http://localhost:4000/api                    │             │
│  │  Production:   https://beautycita.com/api                   │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Features Summary

### 1. **Session Persistence**
- JWT token saved to AsyncStorage
- User data cached locally
- Auto-restore on app restart
- Token verification on startup

### 2. **Multiple Auth Methods**
- Email/Password (traditional)
- Biometric (Face ID/Touch ID/Fingerprint)
- Google OAuth (one-tap sign-in)
- Phone verification (SMS)

### 3. **Smart Navigation**
- Loading state shows splash
- Authenticated users → Main app
- New users → Welcome → Register → Verify → Biometric → Main
- Returning users → Login → Main
- Token invalid → Auto-logout → Welcome

### 4. **Error Handling**
- Form validation with inline errors
- API error display
- Network error handling
- 401 auto-logout
- Retry mechanisms (resend SMS)

### 5. **Security**
- JWT tokens in headers
- Biometric data stays on device
- HTTPS only in production
- Token expiration handling
- Secure AsyncStorage

### 6. **User Experience**
- Auto-focus inputs
- Auto-advance (phone verification)
- Auto-submit when complete
- Loading states everywhere
- Clear error messages
- Dark mode support
- Smooth animations
