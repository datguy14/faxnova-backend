/**
 * Jest Setup
 * Configure test environment and global mocks
 */

// Silence console during tests (optional)
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  // Uncomment to silence logs during tests:
  // console.error = jest.fn();
  // console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Extend Jest timeout for async tests
jest.setTimeout(10000);

// Reset modules before each test
beforeEach(() => {
  jest.resetModules();
});

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock HTTP clients (Sinch, Telnyx, axios, etc.)
jest.mock('axios');

// Mock environment variables
process.env.RESIDENCY_STORAGE_BASE = './test-data';
process.env.DEBUG_RESIDENCY = 'false';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DEFAULT_FAX_PROVIDER = 'telnyx';
process.env.ALLOWED_FILE_HOSTS = 'example.com';

// Optional: In-memory MongoDB
// const { MongoMemoryServer } = require('mongodb-memory-server');
// const mongoose = require('mongoose');
// let mongo;
// beforeAll(async () => {
//   mongo = await MongoMemoryServer.create();
//   await mongoose.connect(mongo.getUri());
// });
// afterAll(async () => {
//   await mongoose.connection.close();
//   await mongo.stop();
// });
