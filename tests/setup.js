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

// Mock environment variables
process.env.RESIDENCY_STORAGE_BASE = './test-data';
process.env.DEBUG_RESIDENCY = 'false';
process.env.NODE_ENV = 'test';
