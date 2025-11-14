# BeautyCita Sprint Backlog Q4 2025
**Planning Period:** November 2025 - January 2026 (12 weeks)
**Sprint Duration:** 2 weeks
**Team Capacity:** Assumed 40-50 hours/week development time

---

## Executive Summary

This backlog prioritizes **technical debt and quality improvements** over new features based on the assessment findings. The current state (10% test coverage, missing observability, critical bugs) poses significant production risks that must be addressed before scaling.

**Key Themes:**
1. **Testing & Quality** (40% of effort)
2. **Observability & Monitoring** (20% of effort)
3. **Bug Fixes & Technical Debt** (25% of effort)
4. **Critical Features** (15% of effort)

---

## Sprint 1: Foundation & Quick Wins (Week 1-2)

### Goal: Fix critical blockers, establish testing infrastructure

### P0 - Critical (Must Complete)
- [ ] **Fix Jest test suite configuration** ✅ DONE
  - [x] Remove duplicate `jest` imports (booking-workflow, queue-service, event-sourcing, graphql)
  - [ ] Fix WebAuthn test mocking issues (`mockResolvedValueOnce` vs `.value` access)
  - [ ] Fix health check tests (mock Redis connection)
  - [ ] Set up test database (`beautycita_test`)
  - **Acceptance:** All tests parse correctly, 0 syntax errors

- [ ] **Set up application metrics**
  - [ ] Create `backend/src/metrics.js` with Prometheus client
  - [ ] Create HTTP metrics middleware
  - [ ] Add `/metrics` endpoint
  - [ ] Configure Prometheus to scrape backend (port 4000)
  - [ ] Create basic Grafana dashboard (HTTP metrics)
  - **Acceptance:** `http_requests_total` returns data, dashboard shows RPS

- [ ] **Install WebKit for mobile E2E tests**
  - [ ] Run `npx playwright install webkit`
  - [ ] Verify all 62 Playwright tests pass
  - **Acceptance:** 62/62 tests pass (31 chromium + 31 webkit)

### P1 - High Priority
- [ ] **Create mock infrastructure for tests**
  - [ ] Mock Redis service
  - [ ] Mock Twilio SMS
  - [ ] Mock Stripe API
  - [ ] Mock Google OAuth
  - [ ] Mock Cloudflare R2
  - **Acceptance:** Tests run without external API calls

- [ ] **Fix Playwright configuration warning**
  - [ ] Update `playwright.config.js` to use separate output directories
  - **Acceptance:** No configuration warnings when running tests

### P2 - Medium Priority
- [ ] **Database health check script**
  - [ ] Create script to check DB size, table row counts, slow queries
  - [ ] Run on production server, document results
  - **Acceptance:** Know current DB state, identify slow queries

**Sprint 1 Deliverables:**
- All tests running without errors
- Prometheus metrics visible in Grafana
- Mobile E2E tests operational
- Test infrastructure ready for Phase 2

---

## Sprint 2: Authentication Testing & Security (Week 3-4)

### Goal: Achieve 80% coverage on authentication, close security gaps

### P0 - Critical
- [ ] **Authentication test suite**
  - [ ] Email/password login tests (valid, invalid, rate limiting)
  - [ ] Password reset flow tests (request → email → token → reset)
  - [ ] Email verification tests
  - [ ] JWT token tests (expiration, refresh, invalidation)
  - [ ] Google OAuth tests (redirect, user creation, account linking)
  - [ ] WebAuthn tests (registration, login, multi-credential)
  - [ ] Session management tests (creation, logout, hijacking prevention)
  - **Acceptance:** `authRoutes.js` >80% coverage, all auth flows tested

- [ ] **Add rate limiting tests**
  - [ ] Test 10 failed login attempts → account lockout
  - [ ] Test API rate limits (30 req/s)
  - [ ] Test auth endpoint limits (10 req/15min)
  - **Acceptance:** Rate limiting confirmed working

### P1 - High Priority
- [ ] **GDPR compliance endpoints**
  - [ ] `GET /api/users/:id/data-export` - Export user data
  - [ ] `DELETE /api/users/:id/gdpr-delete` - Delete user data
  - [ ] Add tests for both endpoints
  - **Acceptance:** Users can export/delete their data

- [ ] **Security audit fixes**
  - [ ] Add Content Security Policy headers
  - [ ] Implement CSRF token validation on forms
  - [ ] Add input sanitization middleware
  - **Acceptance:** CSP headers present, CSRF protection tested

### P2 - Medium Priority
- [ ] **Instrument auth metrics**
  - [ ] `user_registrations_total` (by role, auth_method)
  - [ ] `auth_attempts_total` (success/failed)
  - [ ] `active_users` gauge
  - **Acceptance:** Auth metrics visible in Grafana

**Sprint 2 Deliverables:**
- Authentication 80%+ test coverage
- GDPR compliance implemented
- Security vulnerabilities closed
- Auth metrics dashboard

---

## Sprint 3: Payment Processing Testing (Week 5-6)

### Goal: Achieve 90% coverage on payment processing (CRITICAL - money involved)

### P0 - Critical
- [ ] **Stripe Connect integration tests**
  - [ ] Account creation tests
  - [ ] Onboarding link generation tests
  - [ ] Callback handling tests (success, failed, incomplete)
  - [ ] Account status verification tests
  - **Acceptance:** All Stripe Connect flows tested

- [ ] **Payment Intent tests**
  - [ ] Create payment intent
  - [ ] Calculate platform fee (3%) correctly
  - [ ] Handle payment success webhook
  - [ ] Handle payment failure webhook
  - [ ] Handle payment declined
  - [ ] Test idempotency (no duplicate charges)
  - **Acceptance:** `paymentService.js` >90% coverage

- [ ] **Refund & dispute tests**
  - [ ] Process full refund
  - [ ] Process partial refund
  - [ ] Handle dispute created webhook
  - [ ] Handle dispute won/lost webhooks
  - [ ] Test stylist payout protection during dispute
  - **Acceptance:** All dispute scenarios tested

- [ ] **Payout tests**
  - [ ] Calculate stylist payout (97% of total)
  - [ ] Schedule payout after completion
  - [ ] Handle payout failure
  - [ ] Retry failed payouts
  - **Acceptance:** Payout logic 100% tested

### P1 - High Priority
- [ ] **Payment metrics**
  - [ ] `payments_processed_total` (status, method)
  - [ ] `payment_amount_dollars` histogram
  - [ ] `stripe_webhooks_received_total`
  - [ ] `payout_failures_total`
  - **Acceptance:** Payment metrics dashboard created

- [ ] **Payment edge cases**
  - [ ] Zero-amount payments (free services)
  - [ ] 3D Secure authentication
  - [ ] International cards
  - [ ] Currency conversion (if applicable)
  - **Acceptance:** All edge cases handled and tested

### P2 - Medium Priority
- [ ] **Payment alerts**
  - [ ] Alert: Payment failure rate >10%
  - [ ] Alert: Stripe webhook delivery failures
  - [ ] Alert: Payout processing delays
  - **Acceptance:** Alerts fire on test conditions

**Sprint 3 Deliverables:**
- Payment processing 90%+ test coverage
- Zero untested payment code paths
- Payment metrics & alerts operational
- Confidence in handling money safely

---

## Sprint 4: Booking Workflow Testing (Week 7-8)

### Goal: Achieve 85% coverage on booking system

### P0 - Critical
- [ ] **Booking creation tests (PENDING status)**
  - [ ] Valid booking creation
  - [ ] 5-minute expiration timer
  - [ ] SMS notification to stylist
  - [ ] Event sourcing record
  - [ ] Validation tests (invalid stylist/service)
  - [ ] Double-booking prevention
  - **Acceptance:** Booking creation 100% tested

- [ ] **Stylist acceptance tests (VERIFY_ACCEPTANCE status)**
  - [ ] Accept within 5 minutes → auto-confirm
  - [ ] Accept after 5 minutes → require payment
  - [ ] Reject if expired
  - [ ] 10-minute payment window
  - [ ] SMS notification to client
  - **Acceptance:** All acceptance scenarios tested

- [ ] **Client payment tests (CONFIRMED status)**
  - [ ] Pay within 10 minutes → confirm
  - [ ] Pay after 10 minutes → expired
  - [ ] Payment failure → booking expires
  - [ ] Calendar event creation
  - [ ] Confirmation SMS/email sent
  - **Acceptance:** Payment integration tested

- [ ] **Service execution tests (IN_PROGRESS → COMPLETED)**
  - [ ] Stylist starts service
  - [ ] Status updates correctly
  - [ ] Completion triggers payout
  - [ ] Review request sent after 24h
  - **Acceptance:** Lifecycle tested end-to-end

### P1 - High Priority
- [ ] **Cancellation tests**
  - [ ] Client cancels >24h before → full refund
  - [ ] Client cancels <24h before → partial refund
  - [ ] Stylist cancels → full refund always
  - [ ] No-show handling
  - [ ] Cancellation event sourcing
  - **Acceptance:** All cancellation policies tested

- [ ] **Expiration tests**
  - [ ] PENDING expires after 5 minutes
  - [ ] VERIFY_ACCEPTANCE expires after 10 minutes
  - [ ] Background job processes expirations
  - [ ] Expired bookings cleaned up
  - **Acceptance:** Expiration automation tested

### P2 - Medium Priority
- [ ] **Booking metrics**
  - [ ] `bookings_created_total` (by status)
  - [ ] `booking_status_changes_total` (from→to)
  - [ ] `booking_expiration_total`
  - [ ] `booking_cancellation_total` (by reason)
  - **Acceptance:** Booking metrics dashboard

**Sprint 4 Deliverables:**
- Booking workflow 85%+ test coverage
- All 8 statuses tested
- Event sourcing verified
- Booking metrics operational

---

## Sprint 5: Service Layer & Queue Testing (Week 9-10)

### Goal: Test critical services and background jobs

### P0 - Critical
- [ ] **SMS service tests**
  - [ ] Send verification code
  - [ ] Verify code (valid/invalid/expired)
  - [ ] Send booking notifications
  - [ ] Send proximity alerts
  - [ ] Handle Twilio errors
  - [ ] Rate limiting tests
  - **Acceptance:** `smsService.js` >75% coverage

- [ ] **Queue service tests**
  - [ ] Email queue processing
  - [ ] Reminder queue processing
  - [ ] Payment queue processing
  - [ ] Expiration queue processing
  - [ ] Job retry logic (exponential backoff)
  - [ ] Failed job handling
  - [ ] Graceful shutdown
  - **Acceptance:** `queueService.js` >80% coverage

### P1 - High Priority
- [ ] **Email service tests**
  - [ ] Send booking confirmation
  - [ ] Send reminder (24h, 1h)
  - [ ] Send cancellation notification
  - [ ] Send review request
  - [ ] Send password reset email
  - [ ] Template rendering
  - [ ] Handle SMTP failures
  - **Acceptance:** `emailService.js` >70% coverage

- [ ] **Database instrumentation**
  - [ ] Wrap query function with metrics
  - [ ] Track `db_queries_total` by operation
  - [ ] Track `db_query_duration_seconds`
  - [ ] Track `db_errors_total`
  - [ ] Track `db_connections_active`
  - **Acceptance:** DB metrics in Grafana

### P2 - Medium Priority
- [ ] **Redis instrumentation**
  - [ ] Track `redis_operations_total`
  - [ ] Track `redis_operation_duration_seconds`
  - [ ] Track `redis_connections_active`
  - **Acceptance:** Redis metrics in Grafana

- [ ] **Queue metrics**
  - [ ] Track `queue_jobs_waiting` by queue
  - [ ] Track `queue_jobs_active` by queue
  - [ ] Track `queue_jobs_failed_total`
  - [ ] Track `queue_jobs_completed_total`
  - **Acceptance:** Queue metrics dashboard

**Sprint 5 Deliverables:**
- Service layer 70%+ test coverage
- Queue system 80%+ coverage
- Database metrics operational
- Queue metrics dashboard

---

## Sprint 6: Route/Controller Testing & CI/CD (Week 11-12)

### Goal: Test all API routes, set up automated testing

### P0 - Critical
- [ ] **Route integration tests**
  - [ ] `stylistRoutes.js` (8.54% → 80%)
  - [ ] `bookingRoutes.js` (5.45% → 85%)
  - [ ] `paymentRoutes.js` (8.37% → 90%)
  - [ ] `authRoutes.js` (8.86% → 85%)
  - [ ] `dashboardRoutes.js` (9.83% → 75%)
  - **Acceptance:** All critical routes >80% coverage

- [ ] **CI/CD pipeline setup**
  - [ ] GitHub Actions workflow (or GitLab CI)
  - [ ] Run tests on every commit
  - [ ] Run tests on every PR
  - [ ] Block merges if tests fail
  - [ ] Block merges if coverage drops
  - [ ] Generate coverage reports
  - **Acceptance:** Automated testing on all commits

### P1 - High Priority
- [ ] **Input validation tests**
  - [ ] Test all validation rules
  - [ ] Test SQL injection attempts
  - [ ] Test XSS attempts
  - [ ] Test CSRF token validation
  - [ ] Test file upload validation
  - **Acceptance:** Security validation comprehensive

- [ ] **Error handling tests**
  - [ ] Test 400 Bad Request responses
  - [ ] Test 401 Unauthorized responses
  - [ ] Test 403 Forbidden responses
  - [ ] Test 404 Not Found responses
  - [ ] Test 500 Internal Server Error responses
  - **Acceptance:** All error codes tested

### P2 - Medium Priority
- [ ] **Performance testing setup**
  - [ ] Install Artillery or k6
  - [ ] Create load test scenarios:
    - 100 concurrent bookings
    - 50 concurrent payments
    - 500 concurrent searches
  - [ ] Run baseline performance tests
  - [ ] Document results
  - **Acceptance:** Performance baseline established

- [ ] **Coverage badges**
  - [ ] Add coverage badge to README
  - [ ] Set up Codecov or Coveralls
  - [ ] Make coverage visible to team
  - **Acceptance:** Coverage visible on GitHub

**Sprint 6 Deliverables:**
- All routes >75% test coverage
- CI/CD pipeline operational
- No untested API endpoints
- Performance baseline documented

---

## Summary: Coverage Progress

| Sprint | Target Coverage | Focus Area |
|--------|----------------|------------|
| Sprint 1 (Week 1-2) | 10% → 15% | Infrastructure setup |
| Sprint 2 (Week 3-4) | 15% → 30% | Authentication (80%+) |
| Sprint 3 (Week 5-6) | 30% → 45% | Payments (90%+) |
| Sprint 4 (Week 7-8) | 45% → 60% | Bookings (85%+) |
| Sprint 5 (Week 9-10) | 60% → 70% | Services & Queues |
| Sprint 6 (Week 11-12) | 70% → 80% | Routes & CI/CD |

**Final Target: 80% statements, 70% branches by end of Sprint 6**

---

## Roadmap: Post-Sprint 6 (Weeks 13+)

### Sprint 7-8: Edge Cases & Load Testing
- [ ] Race condition tests
- [ ] Concurrent operation tests
- [ ] Data validation edge cases
- [ ] Load testing all endpoints
- [ ] Database query optimization

### Sprint 9-10: Monitoring & Alerts
- [ ] Complete all alert rules
- [ ] Test alert firing
- [ ] Set up PagerDuty/Slack integration
- [ ] Create runbooks for common alerts
- [ ] Train team on alert response

### Sprint 11-12: Documentation & Polish
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Developer onboarding guide
- [ ] Architecture decision records

---

## Risk Management

### Risk: Testing slows down feature development
**Mitigation:**
- Allocate 30-40% of sprint capacity to testing
- Write tests alongside new features (TDD)
- Celebrate coverage milestones

**Impact if not addressed:** Technical debt compounds, production bugs increase

### Risk: Coverage stalls before reaching 80%
**Mitigation:**
- Make coverage visible (dashboard, badges)
- Require coverage in PR reviews
- Block PRs that decrease coverage

**Impact if not addressed:** Remain at high risk, low confidence in deployments

### Risk: Monitoring not used by team
**Mitigation:**
- Create dashboards for common debugging scenarios
- Train team on using metrics
- Include metrics in incident post-mortems

**Impact if not addressed:** Wasted effort, blind to production issues

### Risk: CI/CD becomes unreliable
**Mitigation:**
- Ensure tests are deterministic (no random data, no time dependencies)
- Clean up test data after each test
- Run tests in parallel for speed

**Impact if not addressed:** Team loses trust in CI, starts merging without tests

---

## Success Metrics

### Sprint 1-2 (Foundation)
- [ ] 0 test syntax errors
- [ ] All 166 tests parsing correctly
- [ ] Prometheus metrics visible
- [ ] Mobile E2E tests operational

### Sprint 3-4 (Critical Paths)
- [ ] Auth coverage >80%
- [ ] Payment coverage >90%
- [ ] GDPR compliance implemented
- [ ] Payment metrics dashboard

### Sprint 5-6 (Full Coverage)
- [ ] Booking coverage >85%
- [ ] Service layer coverage >70%
- [ ] CI/CD pipeline operational
- [ ] Overall coverage >70%

### End of Q4 (Week 12)
- [ ] **Overall coverage: 80% statements, 70% branches**
- [ ] **All tests passing (>99% success rate)**
- [ ] **Test execution <5 minutes**
- [ ] **CI/CD blocking bad merges**
- [ ] **Production bugs reduced by 80%**
- [ ] **Hotfixes reduced by 70%**
- [ ] **Team confident in deployments**

---

## Resource Requirements

### Developer Time
- **Sprint 1-6:** 40-50 hours/week focused on testing & monitoring
- **Code Review:** 10 hours/week
- **Meetings:** 5 hours/week (sprint planning, retrospective, standups)

### Infrastructure
- Test database (already available)
- Redis instance for testing (can mock)
- CI/CD runner (GitHub Actions free tier sufficient)
- Prometheus/Grafana (already running)

### Tools & Licenses
- **Jest:** Free, already installed
- **Playwright:** Free, already installed
- **Supertest:** Free, already installed
- **Artillery/k6:** Free tier sufficient
- **GitHub Actions:** Free for public repos, $0.008/minute for private

### Training
- 2-4 hours: Jest best practices workshop
- 2-4 hours: Prometheus/Grafana training
- 2-4 hours: CI/CD workflows training

**Total Investment: ~$200 for CI/CD minutes (if needed)**

---

## Sprint Planning Template

Each sprint should follow this structure:

### Sprint Planning (Day 1)
1. Review previous sprint results
2. Discuss blockers and risks
3. Prioritize P0/P1/P2 items
4. Assign tasks to team members
5. Set sprint goal and success metrics

### Daily Standups (15 min)
- What did I complete yesterday?
- What am I working on today?
- Any blockers?

### Sprint Review (Last day)
- Demo completed work
- Review coverage progress
- Review metrics dashboards
- Discuss what went well

### Sprint Retrospective (Last day)
- What went well?
- What could be improved?
- Action items for next sprint

---

## Conclusion

This 12-week sprint backlog prioritizes **stability and quality** over new features. The current state (10% coverage, missing metrics) is a **critical risk** that must be addressed before scaling the platform.

By the end of Sprint 6:
- **80% test coverage** (from 10%)
- **Full observability** (metrics, dashboards, alerts)
- **Automated testing** (CI/CD blocking bad code)
- **Production confidence** (deploy without fear)

**The investment in quality now will pay dividends in:**
- Faster feature development (less debugging)
- Higher uptime (fewer production incidents)
- Lower costs (fewer emergency fixes)
- Better user experience (fewer bugs)
- Team morale (less firefighting)

**Next Steps:**
1. Review and approve this backlog
2. Allocate developer time (40-50 hours/week)
3. Start Sprint 1 execution
4. Track progress weekly

**Questions? Contact the development team.**
