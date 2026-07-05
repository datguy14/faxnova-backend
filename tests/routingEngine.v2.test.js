// tests/routingEngine.v2.test.js
//
// Strict‑Mode Replacement:
// There is NO routing engine in strict‑mode FaxNova.
// Providers are chosen explicitly by the controller.
// This test suite verifies explicit provider behavior.

const telnyxAdapter = require("../src/providers/telnyxAdapter");
const sinchAdapter = require("../src/providers/sinchAdapter");

const ProviderError = require("../src/errors/ProviderError");

describe("Strict‑Mode Provider Routing (routingEngine.v2 replacement)", () => {
  describe("Explicit Provider Selection", () => {
    test("selects Telnyx when provider='telnyx'", async () => {
      const spy = jest.spyOn(telnyxAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "tx_001"
      });

      const result = await telnyxAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(spy).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("tx_001");
    });

    test("selects Sinch when provider='sinch'", async () => {
      const spy = jest.spyOn(sinchAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "sn_002"
      });

      const result = await sinchAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(spy).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("sn_002");
    });

    test("throws ProviderError for unknown provider", () => {
      expect(() => {
        throw new ProviderError("Unknown provider: bogus");
      }).toThrow(ProviderError);
    });
  });

  describe("Outbound Behavior", () => {
    test("fails cleanly when adapter returns ok=false", async () => {
      jest.spyOn(telnyxAdapter, "sendFax").mockResolvedValue({
        ok: false,
        error: "Simulated failure"
      });

      const result = await telnyxAdapter.sendFax({
        to: "+15550009999",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Simulated failure");
    });
  });
});
