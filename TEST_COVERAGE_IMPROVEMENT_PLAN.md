# Test Coverage Improvement Plan
**Created:** November 5, 2025
**Current Coverage:** 10% statements, 1.93% branches
**Target Coverage:** 80% statements, 70% branches
**Timeline:** 8-12 weeks

---

## Executive Summary

This plan outlines a systematic approach to increase test coverage from 10% to 80% over the next 3 months. Focus is on critical business logic first (payments, bookings, authentication), then expanding to full coverage.

---

## Phase 1: Fix Existing Test Infrastructure (Week 1-2)

### 1.1 Jest Configuration Fixes ✅ COMPLETED
- [x] Fixed "jest already declared" error
- [x] Removed duplicate `jest` imports from test files

### 1.2 Mock Infrastructure Setup
**Priority:** P0 (Blocking all other tests)

#### Create Test Database
```bash
# On production server
PGPASSWORD='...' psql -h localhost -U postgres -c "CREATE DATABASE beautycita_test OWNER beautycita_app;"
```

#### Mock Redis Service
```javascript
// backend/__tests__/__mocks__/redis.js
module.exports = {
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  })),
};
```

#### Mock External Services
- **Twilio:** Mock SMS verification
- **Stripe:** Mock payment processing
- **Google OAuth:** Mock authentication
- **Cloudflare R2:** Mock image uploads

**Deliverable:** All external dependencies mocked, tests run in isolation

---

## Phase 2: Critical Path Testing (Week 3-6)

### 2.1 Authentication Tests (Week 3)
**Target Files:** `authRoutes.js`, `auth-security.js`
**Current Coverage:** 8.86%, 3.62%
**Target Coverage:** 80%

#### Test Cases Required:
1. **Email/Password Authentication**
   - [x] Valid login succeeds
   - [x] Invalid credentials fail
   - [ ] Account lockout after 10 failed attempts
   - [ ] Password reset flow (request → email → token validation → reset)
   - [ ] Email verification flow
   - [ ] JWT token expiration and refresh

2. **Google OAuth**
   - [ ] OAuth redirect flow
   - [ ] User creation on first login
   - [ ] Linking OAuth account to existing user
   - [ ] OAuth token refresh

3. **WebAuthn/Passkeys**
   - [ ] Registration flow
   - [ ] Login flow
   - [ ] Multiple credentials per user
   - [ ] Credential deletion
   - [ ] Counter validation (prevent replay attacks)

4. **Session Management**
   - [ ] Session creation
   - [ ] Session invalidation on logout
   - [ ] Concurrent session limits
   - [ ] Session hijacking prevention

**Acceptance Criteria:**
- All auth endpoints have >80% coverage
- All security features tested (rate limiting, CSRF, XSS)
- All error paths tested

---

### 2.2 Payment Processing Tests (Week 4)
**Target Files:** `paymentService.js`, `paymentRoutes.js`, Stripe integration
**Current Coverage:** 0%, 8.37%
**Target Coverage:** 90% (CRITICAL - money involved!)

#### Test Cases Required:
1. **Stripe Connect Onboarding**
   - [ ] Create Stripe Connect account
   - [ ] Generate onboarding link
   - [ ] Handle successful onboarding callback
   - [ ] Handle failed/incomplete onboarding

2. **Payment Intent Creation**
   - [ ] Create payment intent for booking
   - [ ] Calculate correct platform fee (3%)
   - [ ] Handle payment success
   - [ ] Handle payment failure
   - [ ] Handle payment declined

3. **Refunds & Disputes**
   - [ ] Process full refund
   - [ ] Process partial refund
   - [ ] Handle dispute created
   - [ ] Handle dispute won
   - [ ] Handle dispute lost
   - [ ] Stylist payout protection during dispute

4. **Payout Processing**
   - [ ] Calculate stylist payout (97% of total)
   - [ ] Schedule payout after booking completion
   - [ ] Handle payout failure
   - [ ] Retry failed payouts

5. **Edge Cases**
   - [ ] Zero-amount payments (free services)
   - [ ] International cards
   - [ ] 3D Secure authentication
   - [ ] Currency conversion
   - [ ] Stripe webhook verification

**Acceptance Criteria:**
- 100% of payment paths tested
- All Stripe webhooks tested
- All error scenarios handled
- Idempotency tested (no duplicate charges)

---

### 2.3 Booking Workflow Tests (Week 5-6)
**Target Files:** `bookingService.js`, `bookingRoutes.js`, `bookingExpiration.js`
**Current Coverage:** 0%, 5.45%, 9.52%
**Target Coverage:** 85%

#### Test Cases Required:
1. **Booking Creation (PENDING status)**
   - [ ] Client creates booking request
   - [ ] 5-minute expiration timer set
   - [ ] SMS notification sent to stylist
   - [ ] Event sourcing record created
   - [ ] Invalid stylist ID rejected
   - [ ] Invalid service ID rejected
   - [ ] Double-booking prevented

2. **Stylist Acceptance (VERIFY_ACCEPTANCE status)**
   - [ ] Stylist accepts within 5 minutes → auto-confirm
   - [ ] Stylist accepts after 5 minutes → require client payment
   - [ ] Acceptance rejected if booking expired
   - [ ] 10-minute payment window set
   - [ ] SMS notification sent to client

3. **Client Payment (CONFIRMED status)**
   - [ ] Client pays within 10 minutes
   - [ ] Booking confirmed
   - [ ] Payment intent created
   - [ ] Calendar event created
   - [ ] Confirmation SMS/email sent
   - [ ] Payment timeout → booking expires

4. **Service Execution (IN_PROGRESS → COMPLETED)**
   - [ ] Stylist starts service
   - [ ] Status updates correctly
   - [ ] Service completion triggers payout
   - [ ] Review request sent after 24 hours

5. **Cancellations**
   - [ ] Client cancellation (before 24h → full refund)
   - [ ] Client cancellation (within 24h → partial refund)
   - [ ] Stylist cancellation (full refund always)
   - [ ] No-show handling
   - [ ] Cancellation event sourcing

6. **Expiration Handling**
   - [ ] PENDING bookings expire after 5 minutes
   - [ ] VERIFY_ACCEPTANCE expires after 10 minutes
   - [ ] Background job processes expirations
   - [ ] Expired bookings cleaned up

**Acceptance Criteria:**
- All 8 booking statuses tested
- All transitions tested
- All expiration scenarios tested
- Event sourcing verified for all state changes

---

## Phase 3: Service Layer Testing (Week 7-8)

### 3.1 SMS Service Tests
**Target File:** `smsService.js`
**Current Coverage:** 4.31%
**Target Coverage:** 75%

#### Test Cases:
- [ ] Send verification code
- [ ] Verify code (valid/invalid/expired)
- [ ] Send booking notifications
- [ ] Send proximity alerts
- [ ] Handle Twilio errors
- [ ] Rate limiting (prevent SMS spam)
- [ ] Phone number validation

### 3.2 Email Service Tests
**Target Files:** `emailService.js`, `emailNotifications.js`
**Current Coverage:** 12.67%, 3.84%
**Target Coverage:** 70%

#### Test Cases:
- [ ] Send booking confirmation
- [ ] Send booking reminder (24h, 1h)
- [ ] Send cancellation notification
- [ ] Send review request
- [ ] Send password reset email
- [ ] Email template rendering
- [ ] Handle SMTP failures
- [ ] Queue management

### 3.3 Queue Service Tests
**Target File:** `queueService.js`
**Current Coverage:** 0%
**Target Coverage:** 80%

#### Test Cases:
- [ ] Email queue processing
- [ ] Reminder queue processing
- [ ] Payment queue processing
- [ ] Expiration queue processing
- [ ] Job retry logic (exponential backoff)
- [ ] Failed job handling
- [ ] Queue stats tracking
- [ ] Graceful shutdown

---

## Phase 4: Route/Controller Testing (Week 9-10)

### Priority Routes to Test:
1. **stylistRoutes.js** (8.54%) → 80%
2. **bookingRoutes.js** (5.45%) → 85%
3. **paymentRoutes.js** (8.37%) → 90%
4. **authRoutes.js** (8.86%) → 85%
5. **dashboardRoutes.js** (9.83%) → 75%
6. **reviewRoutes.js** (0%) → 70%

### Test Strategy:
- Use `supertest` for HTTP integration tests
- Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Test authentication/authorization
- Test input validation
- Test error responses (400, 401, 403, 404, 500)
- Test pagination
- Test rate limiting

---

## Phase 5: Edge Cases & Error Handling (Week 11)

### Areas to Cover:
1. **Database Failures**
   - Connection timeout
   - Query timeout
   - Transaction rollback
   - Deadlock handling

2. **External Service Failures**
   - Stripe API down
   - Twilio SMS fails
   - Email server down
   - Redis connection lost

3. **Race Conditions**
   - Concurrent booking requests
   - Concurrent payment attempts
   - Concurrent account updates

4. **Data Validation**
   - SQL injection attempts
   - XSS attempts
   - CSRF token validation
   - File upload validation (size, type, malicious content)

5. **Business Logic Edge Cases**
   - Booking exactly at midnight
   - Service duration spanning multiple days
   - Stylist in different timezone
   - Daylight saving time transitions

---

## Phase 6: Performance & Load Testing (Week 12)

### Load Testing Scenarios:
1. **Concurrent Bookings**
   - 100 users creating bookings simultaneously
   - Target: <500ms response time, 0% errors

2. **Payment Processing**
   - 50 concurrent payments
   - Target: <2s response time, 0% failures

3. **Search/Browse**
   - 500 concurrent stylist searches
   - Target: <200ms response time

4. **Database Load**
   - Connection pool saturation test
   - Query performance under load

### Tools:
- **Artillery** or **k6** for load testing
- **Clinic.js** for Node.js profiling
- **pg_stat_statements** for database query analysis

---

## Testing Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
describe('Feature', () => {
  it('should do something when condition', async () => {
    // Arrange: Set up test data
    const booking = { ... };

    // Act: Execute the code under test
    const result = await bookingService.createBooking(booking);

    // Assert: Verify the results
    expect(result.status).toBe('PENDING');
    expect(result.id).toBeDefined();
  });
});
```

### 2. Mock vs Integration Tests
- **Unit Tests (80%):** Mock all dependencies, test logic in isolation
- **Integration Tests (15%):** Test actual database/Redis, mock external APIs
- **E2E Tests (5%):** Test full user flows, no mocks

### 3. Test Data Management
```javascript
// Use factories for test data
const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  role: 'CLIENT',
  phone_verified: true,
  ...overrides,
});

// Clean up after each test
afterEach(async () => {
  await db.query('DELETE FROM bookings WHERE client_id = $1', [testUser.id]);
});
```

### 4. Async Testing
```javascript
// Always use async/await in tests
it('should create booking', async () => {
  const booking = await bookingService.create({...});
  expect(booking).toBeDefined();
});

// Set appropriate timeouts
jest.setTimeout(10000); // 10 seconds for integration tests
```

---

## Success Metrics

### Coverage Targets (End of Week 12):
- **Statements:** 80% (currently 10%)
- **Branches:** 70% (currently 1.93%)
- **Functions:** 75% (currently 4.33%)
- **Lines:** 80% (currently 10.06%)

### Quality Metrics:
- **Test Pass Rate:** >99%
- **Test Execution Time:** <5 minutes for full suite
- **Flaky Test Rate:** <1%
- **Code Review Coverage:** 100% of test code reviewed

### Business Impact Metrics:
- **Production Bugs:** Reduce by 80%
- **Hotfix Deployments:** Reduce by 70%
- **Regression Bugs:** Reduce by 90%
- **Time to Deploy:** Reduce by 50% (faster CI/CD with confidence)

---

## Immediate Action Items

### This Week (Week 1):
1. **Set up test database** on production server
2. **Create mock infrastructure** for Redis, Twilio, Stripe
3. **Fix WebAuthn tests** (mock access issues)
4. **Fix health check tests** (timeout issues)
5. **Add test database seeding scripts**

### Next Week (Week 2):
1. **Write authentication tests** (all flows)
2. **Achieve 80% auth coverage**
3. **Set up CI/CD** to run tests on every commit
4. **Block merges if coverage drops**

### Resources Needed:
- **Developer Time:** 40-50 hours/week for 12 weeks
- **Code Review Time:** 10 hours/week
- **Infrastructure:** Test database, Redis instance
- **Tools:** Jest, Supertest, Artillery/k6, Istanbul

---

## Risk Mitigation

### Risk: Testing slows down feature development
**Mitigation:**
- Write tests alongside new features (TDD)
- Allocate 30% of sprint capacity to testing backlog
- Run tests in parallel (4+ workers)

### Risk: Tests become flaky
**Mitigation:**
- Avoid time-dependent tests (use `jest.useFakeTimers()`)
- Clean up test data after each test
- Use deterministic test data (avoid random values)

### Risk: Coverage stalls before reaching 80%
**Mitigation:**
- Make coverage visible (dashboard)
- Set coverage requirements in PR reviews
- Celebrate coverage milestones

---

## Conclusion

This plan transforms BeautyCita from **10% coverage (critical risk)** to **80% coverage (production-ready)** over 12 weeks. The focus on critical paths first (auth, payments, bookings) ensures the highest-risk code is protected immediately.

**Next Steps:**
1. Review and approve this plan
2. Allocate developer time
3. Set up test infrastructure (Week 1)
4. Begin Phase 1 execution

**Questions? Contact the development team or refer to:**
- Jest Documentation: https://jestjs.io/
- Testing Best Practices: `/docs/testing-guide.md`
- CI/CD Setup: `/docs/ci-cd-setup.md`
