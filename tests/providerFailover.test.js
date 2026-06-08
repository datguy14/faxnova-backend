import { sendFax } from "../src/services/faxService.js";

// Mock both providers
jest.mock("../src/providers/sinchProvider.js", () => ({
  sendFax: jest.fn()
}));

jest.mock("../src/providers/telnyxProvider.js", () => ({
  sendFax: jest.fn()
}));

import * as sinch from "../src/providers/sinchProvider.js";
import * as telnyx from "../src/providers/telnyxProvider.js";

describe("Provider Sovereignty: Multi‑Provider Failover Logic", () => {
  const faxPayload = {
    to: "+18885551234",
    from: "+18885554321",
    fileUrl: "https://example.com/file.pdf"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("falls back to Telnyx when Sinch fails", async () => {
    sinch.sendFax.mockRejectedValue(new Error("Sinch outage"));
    telnyx.sendFax.mockResolvedValue({ faxId: "TEL-123" });

    const result = await sendFax(faxPayload);

    expect(sinch.sendFax).toHaveBeenCalled();
    expect(telnyx.sendFax).toHaveBeenCalled();
    expect(result.faxId).toBe("TEL-123");
  });

  it("falls back to Sinch when Telnyx fails", async () => {
    telnyx.sendFax.mockRejectedValue(new Error("Telnyx outage"));
    sinch.sendFax.mockResolvedValue({ faxId: "SINCH-456" });

    const result = await sendFax(faxPayload);

    expect(telnyx.sendFax).toHaveBeenCalled();
    expect(sinch.sendFax).toHaveBeenCalled();
    expect(result.faxId).toBe("SINCH-456");
  });

  it("does not leak tribal data during failover", async () => {
    sinch.sendFax.mockRejectedValue(new Error("Sinch outage"));
    telnyx.sendFax.mockResolvedValue({ faxId: "TEL-999" });

    const payloadWithTribalData = {
      ...faxPayload,
      tribalEnrollmentNumber: "999999",
      censusId: "123456789"
    };

    const result = await sendFax(payloadWithTribalData);

    expect(result.faxId).toBe("TEL-999");
    expect(result.tribalEnrollmentNumber).toBeUndefined();
    expect(result.censusId).toBeUndefined();
  });

  it("logs sovereignty‑grade failover metadata", async () => {
    sinch.sendFax.mockRejectedValue(new Error("Sinch outage"));
    telnyx.sendFax.mockResolvedValue({ faxId: "TEL-777" });

    const result = await sendFax(faxPayload);

    expect(result.failoverUsed).toBe(true);
    expect(result.primaryProvider).toBe("sinch");
    expect(result.fallbackProvider).toBe("telnyx");
  });
});
