# BeautyCita Testing Guide

## Overview

This document provides comprehensive instructions for running and maintaining the BeautyCita test suite.

**Test Coverage:** 6 critical areas
**Test Files:** 6 comprehensive test suites
**Total Tests:** 150+ test cases
**Frameworks:** Jest (backend) + Vitest (frontend)

---

## 🎯 Test Coverage

### Priority Areas Covered

1. **Booking Workflow** (`booking-workflow.test.js`)
   - PENDING → VERIFY_ACCEPTANCE → CONFIRMED → IN_PROGRESS → COMPLETED
   - 5-minute request expiration
   - 10-minute payment window
   - Auto-booking for rapid acceptance
   - Status validation

2. **Payment Processing** (`payment-processing.test.js`)
   - Stripe payment intent creation/confirmation
   - 3% platform fee calculation
   - Full and partial refunds
   - Stylist payout (97%)
   - No-show payout splits (60/40, 100/0)
   - Webhook handling

3. **Authentication** (`authentication.test.js`)
   - Email/Password (bcrypt hashing)
   - Google OAuth 2.0
   - SMS Verification (Twilio)
   - WebAuthn (separate test file)
   - JWT token management
   - Role-based access control

4. **Expiration Handling** (`expiration-handling.test.js`)
   - 5-minute booking request expiration
   - 10-minute payment confirmation window
   - Auto-booking window (5 minutes)
   - Background job processing
   - Grace period handling

5. **Cancellation Policies** (`cancellation-policies.test.js`)
   - Client: 12-hour policy (full refund before)
   - Stylist: 3-hour restriction
   - No-show scenarios (60/40 split)
   - Refund amount calculations
   - Admin override system

6. **WebAuthn** (`webauthn.test.js`)
   - Registration flow (credential creation)
   - Login flow (authentication)
   - Challenge management
   - Credential storage & management
   - Counter rollback detection
   - Security validations

---

## 🚀 Quick Start

### Install Dependencies

```bash
# Already installed!
# Backend: jest, supertest, @jest/globals, @types/jest, @types/supertest
# Frontend: vitest, @testing-library/react, @testing-library/jest-dom
```

### Run All Tests

```bash
cd /var/www/beautycita.com

# Run all backend tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on changes)
npm run test:watch

# Run for CI/CD (production)
npm run test:ci
```

---

## 📋 Running Specific Tests

### Run Single Test File

```bash
# Booking workflow tests only
npm test -- booking-workflow.test.js

# Payment processing tests only
npm test -- payment-processing.test.js

# Authentication tests only
npm test -- authentication.test.js
```

### Run Specific Test Suite

```bash
# Run only "Client Cancellation Policy" tests
npm test -- --testNamePattern="Client Cancellation Policy"

# Run only WebAuthn registration tests
npm test -- --testNamePattern="WebAuthn Registration"
```

### Run by Pattern

```bash
# Run all tests with "expiration" in the name
npm test -- --testNamePattern=expiration

# Run all tests with "refund" in the name
npm test -- --testNamePattern=refund
```

---

## 📊 Test Results & Coverage

### View Coverage Report

```bash
npm run test:coverage

# Coverage report will be in: coverage/lcov-report/index.html
# Open in browser to see detailed breakdown
```

### Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Booking System | 80%+ | TBD |
| Payment Processing | 85%+ | TBD |
| Authentication | 90%+ | TBD |
| Overall | 75%+ | TBD |

---

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js'],
};
```

### Test Setup (`backend/__tests__/setup.js`)

- Sets `NODE_ENV=test`
- Mocks Stripe API calls
- Mocks Twilio SMS/Verification
- Configures test database connection
- Sets 10-second timeout

---

## 🧪 Test Structure

### Example Test File Structure

```javascript
describe('Feature Name Tests', () => {
  let mockDb;

  beforeAll(() => {
    // Setup that runs once before all tests
  });

  beforeEach(() => {
    // Setup that runs before each test
    mockDb = { query: jest.fn() };
  });

  describe('1. Specific Functionality', () => {
    it('should do something correctly', async () => {
      // Arrange
      const input = 'test data';

      // Act
      const result = await someFunction(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

---

## 📝 Writing New Tests

### Best Practices

1. **Follow AAA Pattern:**
   - Arrange: Set up test data
   - Act: Execute the function
   - Assert: Verify the result

2. **Use Descriptive Names:**
   ```javascript
   // Good
   it('should calculate 3% platform fee correctly for $100 booking', () => {})

   // Bad
   it('test fee calculation', () => {})
   ```

3. **Test One Thing Per Test:**
   ```javascript
   // Good - focused test
   it('should reject booking if stylist not found', () => {})

   // Bad - tests multiple things
   it('should validate all booking fields', () => {})
   ```

4. **Use Mocks Appropriately:**
   ```javascript
   // Mock external services
   const stripe = require('stripe')();
   stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });

   // Mock database queries
   mockDb.query.mockResolvedValueOnce({ rows: [...] });
   ```

5. **Clean Up After Tests:**
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

---

## 🐛 Debugging Tests

### Run Tests with Debugging

```bash
# Run tests with full error stack traces
npm test -- --verbose

# Run single test file with debugging
node --inspect-brk node_modules/.bin/jest backend/__tests__/booking-workflow.test.js
```

### Common Issues

**Issue: "Cannot find module"**
```bash
# Solution: Ensure all dependencies are installed
npm install
```

**Issue: "Timeout of 10000ms exceeded"**
```bash
# Solution: Increase timeout in jest.config.js
testTimeout: 30000
```

**Issue: "Database connection error"**
```bash
# Solution: Check test database credentials in setup.js
# Or skip database tests with mocks
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

---

## 📈 Test Metrics

### Current Test Count by Category

| Category | Test File | # of Tests |
|----------|-----------|------------|
| Booking Workflow | booking-workflow.test.js | 25+ |
| Payment Processing | payment-processing.test.js | 30+ |
| Authentication | authentication.test.js | 35+ |
| Expiration Handling | expiration-handling.test.js | 25+ |
| Cancellation Policies | cancellation-policies.test.js | 25+ |
| WebAuthn | webauthn.test.js | 30+ |
| **TOTAL** | **6 files** | **170+** |

---

## 🎓 Testing Checklist

Before deploying to production, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Coverage is above 75% (`npm run test:coverage`)
- [ ] No console.log statements in test files
- [ ] All mocks are properly configured
- [ ] Test database is separate from production
- [ ] Sensitive data is not hardcoded in tests
- [ ] Tests run in CI/CD pipeline
- [ ] New features have corresponding tests

---

## 🔗 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [WebAuthn Testing](https://webauthn.io/)

### Test Data
- **Stripe Test Cards:** https://stripe.com/docs/testing#cards
- **Twilio Test Numbers:** https://www.twilio.com/docs/iam/test-credentials

### Internal Docs
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./database/schema.sql)
- [Security Audit Report](./SECURITY_AUDIT_REPORT.md)

---

## 🚨 Troubleshooting

### Test Database Setup

If you need a separate test database:

```sql
-- Create test database
CREATE DATABASE beautycita_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE beautycita_test TO beautycita_app;

-- Run migrations
psql -d beautycita_test -f database/schema.sql
```

### Reset Test Database

```bash
# Drop and recreate test database
PGPASSWORD='...' psql -h localhost -U postgres -c "DROP DATABASE beautycita_test;"
PGPASSWORD='...' psql -h localhost -U postgres -c "CREATE DATABASE beautycita_test;"
PGPASSWORD='...' psql -h localhost -U beautycita_app -d beautycita_test -f database/schema.sql
```

---

## 📞 Support

If you encounter issues with the test suite:

1. Check this guide first
2. Review test output for specific error messages
3. Verify all dependencies are installed
4. Ensure test environment variables are set
5. Contact the development team

---

**Last Updated:** October 21, 2025
**Test Suite Version:** 1.0
**Maintained By:** BeautyCita Development Team
