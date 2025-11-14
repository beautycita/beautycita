// Mock Redis client for testing
const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setEx: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  hGet: jest.fn().mockResolvedValue(null),
  hSet: jest.fn().mockResolvedValue(1),
  hGetAll: jest.fn().mockResolvedValue({}),
  hDel: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  flushAll: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  isOpen: true,
  isReady: true,
};

const createClient = jest.fn(() => mockRedisClient);

module.exports = {
  createClient,
  mockRedisClient,
};
