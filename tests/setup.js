/**
 * Jest Setup
 * Configure test environment, global mocks, and test isolation
 */

// Preserve original console behavior
const originalError = console.error;
const originalLog = console.log;

// Optional: silence logs during tests
beforeAll(() => {
  // console.error = jest.fn();
  // console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Extend Jest timeout for async/provider-heavy tests
jest.setTimeout(10000);

// Reset modules before each test to avoid state bleed
beforeEach(() => {
  jest.resetModules();
});

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock HTTP clients (Sinch, Telnyx, axios, etc.)
jest.mock('axios');

// Load provider mocks (Sinch + Telnyx)
require('./mocks/providers.mock');

// Core environment variables for test mode
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DEFAULT_FAX_PROVIDER = 'telnyx';
process.env.ALLOWED_FILE_HOSTS = 'example.com';

// Residency engine test config
process.env.RESIDENCY_STORAGE_BASE = './test-data';
process.env.DEBUG_RESIDENCY = 'false';

// Optional: In-memory MongoDB (uncomment if needed)
/*
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
*/
