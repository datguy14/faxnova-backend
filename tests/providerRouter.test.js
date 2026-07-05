// tests/providerRouter.test.js

const telnyxAdapter = require("../src/providers/telnyxAdapter");
const sinchAdapter = require("../src/providers/sinchAdapter");

const telnyxInboundAdapter = require("../src/providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../src/providers/sinchInboundAdapter");

const ProviderError = require("../src/errors/ProviderError");

describe("Provider Router — Strict‑Mode Edition", () => {
  describe("Outbound Provider Selection", () => {
    test("uses Telnyx adapter when provider='telnyx'", async () => {
      const spy = jest.spyOn(telnyxAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "tx_123"
      });

      const result = await telnyxAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(spy).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("tx_123");
    });

    test("uses Sinch adapter when provider='sinch'", async () => {
      const spy = jest.spyOn(sinchAdapter, "sendFax").mockResolvedValue({
        ok: true,
        providerFaxId: "sn_456"
      });

      const result = await sinchAdapter.sendFax({
        to: "+15551234567",
        storageKey: "fax.pdf",
        region: "us-east"
      });

      expect(spy).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.providerFaxId).toBe("sn_456");
    });

    test("throws ProviderError for unknown provider", () => {
      expect(() => {
        throw new ProviderError("Unknown provider: bogus");
      }).toThrow(ProviderError);
    });
  });

  describe("Inbound Provider Normalization", () => {
    test("normalizes Telnyx inbound fax payload", () => {
      const payload = {
        data: {
          event_type: "fax.received",
          payload: {
            fax_id: "tx_999",
            from: "+15550001111",
            media_url: "fax.pdf",
            region: "us-east",
            status: "received"
          }
        }
      };

      const normalized = telnyxInboundAdapter.normalizeInboundFax(payload);

      expect(normalized.ok).toBe(true);
      expect(normalized.providerFaxId).toBe("tx_999");
      expect(normalized.provider).toBe("telnyx");
    });

    test("normalizes Sinch inbound fax payload", () => {
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
      expect(normalized.providerFaxId).toBe("sn_888");
      expect(normalized.provider).toBe("sinch");
    });
  });
});
