#!/bin/bash
# Comprehensive test runner for BeautyCita

set -e

echo "================================"
echo "BeautyCita Test Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Backend tests
echo -e "Running Backend Tests..."
if npm run test; then
  echo -e "✓ Backend tests passed"
else
  echo -e "✗ Backend tests failed"
  FAILED=1
fi
echo ""

# Frontend unit tests
echo -e "Running Frontend Unit Tests..."
cd frontend
if npm run test:run; then
  echo -e "✓ Frontend unit tests passed"
else
  echo -e "✗ Frontend unit tests failed"
  FAILED=1
fi
cd ..
echo ""

# Frontend E2E tests
echo -e "Running E2E Tests..."
cd frontend
if npm run test:e2e; then
  echo -e "✓ E2E tests passed"
else
  echo -e "✗ E2E tests failed"
  FAILED=1
fi
cd ..
echo ""

# Summary
echo "================================"
if [  -eq 0 ]; then
  echo -e "All tests passed!"
  exit 0
else
  echo -e "Some tests failed"
  exit 1
fi
