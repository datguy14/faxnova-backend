const request = require("supertest");
const app = require("../server");
const { getResidencyZone } = require("../src/residency/policy.js");

// Mock getResidencyZone so we can assert behavior
jest.mock("../src/residency/policy.js", () => ({
  getResidencyZone: jest.fn(() => "mock-zone")
}));

describe("Residency Guard Middleware", () => {
  test("Attaches residencyZone and residencyCountry from x-country header", async () => {
    const res = await request(app)
      .get("/health")
      .set("x-country", "US");

    expect(res.status).toBe(200);

    // Residency guard doesn't expose values in response,
    // so we verify the function was called correctly.
    expect(getResidencyZone).toHaveBeenCalledWith("US");
  });

  test("Falls back to req.user.country when x-country is missing", async () => {
    // Inject fake user via middleware override
    const fakeUserApp = require("express")();
    fakeUserApp.use((req, res, next) => {
      req.user = { country: "DE" };
      next();
    });
    fakeUserApp.use(require("../src/middleware/residencyGuard.js").residencyGuard);
    fakeUserApp.get("/test", (req, res) => res.json({ zone: req.residencyZone }));

    const res = await request(fakeUserApp).get("/test");

    expect(getResidencyZone).toHaveBeenCalledWith("DE");
    expect(res.body.zone).toBe("mock-zone");
  });

  test("Falls back to req.ip when no headers or user country exist", async () => {
    const res = await request(app).get("/health");

    // req.ip will be something like "::ffff:127.0.0.1"
    const ip = expect.any(String);

    expect(getResidencyZone).toHaveBeenCalledWith(ip);
    expect(res.status).toBe(200);
  });

  test("Returns 500 if residency detection throws", async () => {
    getResidencyZone.mockImplementationOnce(() => {
      throw new Error("Boom");
    });

    const res = await request(app)
      .get("/health")
      .set("x-country", "US");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Residency detection failed");
  });
});
