module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Required for raw-body webhook tests
  transform: {},

  // Prevent Jest from hanging due to open MongoDB handles
  forceExit: true,
  detectOpenHandles: true,

  verbose: true,

  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/db.js",
    "!src/residency/policy.js"
  ],
  coverageDirectory: "coverage"
};
