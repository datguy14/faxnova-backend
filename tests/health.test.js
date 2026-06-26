// tests/health.test.js

// Load supertest so we can make HTTP calls to the Express app
const request = require("supertest");

// Import your Express app (NOT the server)
// This avoids binding to a port and makes tests fast + isolated
const app = require("../src/app");

// Group of tests
describe("Health check", () => {

  // Individual test
  it("returns ok", async () => {

    // Make a GET request to /health
    const res = await request(app).get("/health");

    // Expect HTTP 200
    expect(res.status).toBe(200);

    // Expect JSON body: { status: "ok" }
    expect(res.body.status).toBe("ok");
  });
});
