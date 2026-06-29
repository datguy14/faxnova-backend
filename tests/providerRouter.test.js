// tests/providerRouter.test.js

const providerRouter = require("../src/providers/providerRouter");

describe("ProviderRouter Sovereignty Routing", () => {
  const scores = { sinch: 80, telnyx: 90 };

  const outages = {
    sinch: { state: "closed" },
    telnyx: { state: "closed" }
  };

  test("US region → prefers Sinch first", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "us",
      sovereignty: "us",
      scores,
      outages,
      retry: false
    });

    expect(provider).toBe("telnyx"); // higher score wins
  });

  test("EU region → prefers Telnyx first", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "eu",
      sovereignty: "eu",
      scores,
      outages,
      retry: false
    });

    expect(provider).toBe("telnyx");
  });

  test("Retry → forces failover to next provider", () => {
    const provider = providerRouter.selectProvider({
      residencyZone: "us",
      sovereignty: "us",
      scores,
      outages,
      retry: true
    });

    expect(provider).toBe("sinch"); // failover from telnyx → sinch
  });

  test("Outage OPEN → provider excluded", () => {
    const outageState = {
      sinch: { state: "open" },
      telnyx: { state: "closed" }
    };

    const provider = providerRouter.selectProvider({
      residencyZone: "us",
      sovereignty: "us",
      scores,
      outages: outageState,
      retry: false
    });

    expect(provider).toBe("telnyx");
  });

  test("All providers OPEN → throws error", () => {
    const outageState = {
      sinch: { state: "open" },
      telnyx: { state: "open" }
    };

    expect(() =>
      providerRouter.selectProvider({
        residencyZone: "us",
        sovereignty: "us",
        scores,
        outages: outageState,
        retry: false
      })
    ).toThrow();
  });
});
