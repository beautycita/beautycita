module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/*.test.js',
    '!backend/src/**/*.spec.js',
  ],
  testMatch: [
    '**/backend/__tests__/**/*.test.js',
    '**/backend/src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^uuid$': '<rootDir>/backend/__tests__/__mocks__/uuid.js',
  },
}
