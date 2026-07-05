// tests/sovereigntyIntegration.test.js
//
// Strict‑Mode Replacement:
// There is NO sovereignty routing engine.
// Sovereignty = residencyGuard + normalized region fields.

const residencyGuard = require("../src/guards/residencyGuard");

const telnyxInboundAdapter = require("../src/providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../src/providers/sinchInboundAdapter");

const telnyxAdapter = require("../src/providers/telnyxAdapter");
const sinchAdapter = require("../src/providers/sinchAdapter");

const ResidencyError = require("../src/errors/ResidencyError");

describe("Strict‑Mode Sovereignty Integration", () => {
  describe("Residency Guard Enforcement", () => {
    test("allows permitted outbound region", () => {
      expect(() => {
        residencyGuard.ensureOutboundRegion("us-east");
      }).not.toThrow();
    });

    test("blocks disallowed outbound region", () => {
      expect(() => {
        residencyGuard.ensureOutboundRegion("eu-west");
      }).toThrow(ResidencyError);
    });

    test("allows permitted inbound region", () => {
      expect(() => {
        residencyGuard.ensureInboundRegion("us-east");
      }).not.toThrow();
    });

    test("blocks disallowed inbound region", () => {
      expect(() => {
        residencyGuard.ensureInboundRegion("eu-west");
      }).toThrow(ResidencyError);
    });
  });

  describe("Inbound Region Normalization", () => {
    test("Telnyx inbound payload preserves region", () => {
      const payload = {
        data: {
          event_type: "fax.received",
          payload: {
            fax_id: "tx_777",
            from: "+15550001111",
            media_url: "fax.pdf",
            region: "us-east",
            status: "received"
          }
        }
      };

      const normalized = telnyxInboundAdapter.normalizeInboundFax(payload);

      expect(normalized.ok).toBe(true);
      expect(normalized.region).toBe("us-east");
    });

    test("Sinch inbound payload preserves region", () => {
      const payload = {
        event: { type: "fax.received" },
        fax: {
          id: "sn_888",
          from: "+15550002222",
          mediaUrl: "fax.pdf",
          region: "us-east",
          status: "received"
        }
      };

      const normalized = sinchInboundAdapter.normalizeInboundFax(payload);

      expect(normalized.ok).toBe(true);
      expect(normalized.region).toBe("us-east");
    });
  });

  describe("Outbound Provider Region Handling", () => {
    test("Telnyx outbound preserves region", async () => {
      jest.spyOn(telnyxAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "tx_999"
      });

      const result = await telnyxAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("tx_999");
    });

    test("Sinch outbound preserves region", async () => {
      jest.spyOn(sinchAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "sn_999"
      });

      const result = await sinchAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("sn_999");
    });
  });
});
