// tests/routingEngine.v2.test.js

jest.mock("../src/services/providerPerformanceService", () => ({
  getScores: jest.fn().mockResolvedValue({ sinch: 70, telnyx: 95 })
}));

jest.mock("../src/services/providerOutageService", () => ({
  getOutageStates: jest.fn().mockResolvedValue({
    sinch: { state: "closed" },
    telnyx: { state: "closed" }
  })
}));

const { routeFax } = require("../src/services/routingService.v2");

describe("RoutingEngine v2 Sovereignty Tests", () => {
  test("US region → selects correct provider", async () => {
    const { provider } = await routeFax({ region: "us", retry: false });
    expect(provider).toBe("telnyx");
  });

  test("EU region → selects correct provider", async () => {
    const { provider } = await routeFax({ region: "eu", retry: false });
    expect(provider).toBe("telnyx");
  });

  test("Retry → forces failover", async () => {
    const { provider } = await routeFax({ region: "us", retry: true });
    expect(provider).toBe("sinch");
  });
});
