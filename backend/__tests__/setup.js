// Test setup file
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DB_HOST = 'localhost'
process.env.DB_NAME = 'beautycita_test'
process.env.DB_USER = 'beautycita_app'
process.env.DB_PASSWORD = 'qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk='

// Global test timeout
jest.setTimeout(10000)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Cleanup after all tests
afterAll(async () => {
  // Close any open database connections
  if (global.db && global.db.end) {
    await global.db.end()
  }

  // Close Redis connections
  if (global.redisClient && global.redisClient.quit) {
    await global.redisClient.quit()
  }

  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500))
})
