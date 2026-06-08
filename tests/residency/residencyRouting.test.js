/**
 * Tests for Residency-Aware Provider Router
 */

import { routeFax, isProviderAvailable, getProviderStatus } from "../../src/services/providerRouter.js";

jest.mock("../../src/integrations/sinchProvider.js");
jest.mock("../../src/integrations/telnyxProvider.js");

import * as sinch from "../../src/integrations/sinchProvider.js";
import * as telnyx from "../../src/integrations/telnyxProvider.js";

describe("Residency-Aware Provider Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("routeFax", () => {
    it("routes through primary provider if allowed in zone", async () => {
      const payload = { to: "+1234567890", from: "+0987654321", document: "test" };
      sinch.sendFax.mockResolvedValue({ faxId: "123", status: "sent" });

      const result = await routeFax(payload, "us-east-tribal");

      expect(sinch.sendFax).toHaveBeenCalledWith(payload);
      expect(result.primaryProvider).toBe("sinch");
      expect(result.residencyZone).toBe("us-east-tribal");
      expect(result.failoverUsed).toBe(false);
    });

    it("uses fallback provider if primary fails", async () => {
      const payload = { to: "+1234567890" };
      sinch.sendFax.mockRejectedValue(new Error("Sinch failed"));
      telnyx.sendFax.mockResolvedValue({ faxId: "456", status: "sent" });

      const result = await routeFax(payload, "us-east-tribal");

      expect(sinch.sendFax).toHaveBeenCalled();
      expect(telnyx.sendFax).toHaveBeenCalled();
      expect(result.fallbackProvider).toBe("telnyx");
      expect(result.failoverUsed).toBe(true);
    });

    it("respects zone constraints and skips disallowed providers", async () => {
      const payload = { to: "+1234567890" };
      telnyx.sendFax.mockResolvedValue({ faxId: "789", status: "sent" });

      const result = await routeFax(payload, "eu-sovereign");

      // In EU sovereign zone, sinch is not allowed, so should use telnyx
      expect(result.primaryProvider).toBe("sinch");
      expect(telnyx.sendFax).toHaveBeenCalled();
    });

    it("throws error if all providers fail", async () => {
      const payload = { to: "+1234567890" };
      sinch.sendFax.mockRejectedValue(new Error("Sinch failed"));
      telnyx.sendFax.mockRejectedValue(new Error("Telnyx failed"));

      await expect(routeFax(payload, "us-east-tribal")).rejects.toThrow();
    });

    it("includes residency zone in response", async () => {
      const payload = { to: "+1234567890" };
      sinch.sendFax.mockResolvedValue({ faxId: "123" });

      const result = await routeFax(payload, "eu-sovereign");

      expect(result.residencyZone).toBe("eu-sovereign");
    });
  });

  describe("isProviderAvailable", () => {
    it("returns true for allowed providers in zone", () => {
      expect(isProviderAvailable("us-east-tribal", "sinch")).toBe(true);
      expect(isProviderAvailable("us-east-tribal", "telnyx")).toBe(true);
    });

    it("returns false for disallowed providers in zone", () => {
      expect(isProviderAvailable("eu-sovereign", "sinch")).toBe(false);
    });
  });

  describe("getProviderStatus", () => {
    it("returns provider availability for zone", () => {
      const status = getProviderStatus("us-east-tribal");

      expect(status.zone).toBe("us-east-tribal");
      expect(Array.isArray(status.availableProviders)).toBe(true);
      expect(status.providerCount).toBeGreaterThan(0);
    });

    it("defaults to global zone", () => {
      const status = getProviderStatus();

      expect(status.zone).toBe("global");
    });
  });
});
