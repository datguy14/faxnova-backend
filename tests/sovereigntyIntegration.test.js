// tests/sovereigntyIntegration.test.js

const providerRouter = require("../src/providers/providerRouter");

describe("Full Sovereignty Integration", () => {
  const scores = { sinch: 60, telnyx: 85 };

  const outages = {
    sinch: { state: "closed" },
    telnyx: { state: "closed" }
  };

  test("US job → US provider order → correct adapter", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "us",
      sovereignty: "us",
      scores,
      outages,
      retry: false
    });

    const adapter = providerRouter.getAdapter(provider);

    expect(provider).toBe("telnyx");
    expect(adapter).toBeDefined();
  });

  test("EU job → EU provider order → correct adapter", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "eu",
      sovereignty: "eu",
      scores,
      outages,
      retry: false
    });

    const adapter = providerRouter.getAdapter(provider);

    expect(provider).toBe("telnyx");
    expect(adapter).toBeDefined();
  });

  test("Global job → global fallback order", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "global",
      sovereignty: "global",
      scores,
      outages,
      retry: false
    });

    expect(provider).toBe("telnyx");
  });
});
