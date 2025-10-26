# BeautyCita Testing Framework

Complete automated testing suite for BeautyCita platform.

## Overview

- **Frontend Unit Tests**: Vitest + React Testing Library
- **Backend API Tests**: Jest + Supertest  
- **E2E Tests**: Playwright
- **Coverage Target**: 50% minimum (configured in jest.config.js)

---

## Quick Start

### Run All Tests
```bash
./run-tests.sh
```

### Frontend Tests
```bash
cd frontend

# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:run

# Unit tests with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Backend Tests
```bash
# All backend tests
npm test

# Watch mode
npm run test:watch

# CI mode (with coverage)
npm run test:ci
```

### E2E Tests
```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

---

## Test Files

### Frontend
- **Unit Tests**: `src/**/*.test.tsx`, `src/**/*.spec.tsx`
- **E2E Tests**: `e2e/**/*.spec.ts`
- **Config**: `vitest.config.ts`, `playwright.config.ts`
- **Setup**: `src/test/setup.ts`, `src/test/testUtils.tsx`

### Backend
- **Test Files**: `backend/__tests__/**/*.test.js`
- **Config**: `jest.config.js`
- **Setup**: `backend/__tests__/setup.js`

---

## Writing Tests

### Frontend Component Test
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/testUtils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title=Test />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Backend API Test
```javascript
const request = require('supertest')
const app = require('../src/server')

describe('API Endpoint', () => {
  it('should return 200', async () => {
    const res = await request(app)
      .get('/api/endpoint')
    expect(res.status).toBe(200)
  })
})
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@test.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to `master`, `main`, `develop`
- Pull requests

Workflow file: `.github/workflows/test.yml`

### Pre-commit Hook (Recommended)
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit npm
