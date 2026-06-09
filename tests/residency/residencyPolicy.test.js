/**
 * Tests for Residency Policy Engine
 */

import {
  getResidencyZone,
  isProviderAllowed,
  getProvidersForZone,
  getZoneConfig,
  listZones
} from "../../src/residency/policy.js";

describe("Residency Policy", () => {
  describe("getResidencyZone", () => {
    it("maps US country code to us-east-tribal zone", () => {
      expect(getResidencyZone("US")).toBe("us-east-tribal");
    });

    it("maps EU country codes to eu-sovereign zone", () => {
      expect(getResidencyZone("DE")).toBe("eu-sovereign");
      expect(getResidencyZone("FR")).toBe("eu-sovereign");
      expect(getResidencyZone("NL")).toBe("eu-sovereign");
      expect(getResidencyZone("IT")).toBe("eu-sovereign");
    });

    it("defaults to global for unknown countries", () => {
      expect(getResidencyZone("XX")).toBe("global");
      expect(getResidencyZone(null)).toBe("global");
      expect(getResidencyZone(undefined)).toBe("global");
    });
  });

  describe("isProviderAllowed", () => {
    it("allows sinch and telnyx in us-east-tribal zone", () => {
      expect(isProviderAllowed("us-east-tribal", "sinch")).toBe(true);
      expect(isProviderAllowed("us-east-tribal", "telnyx")).toBe(true);
    });

    it("allows only telnyx in eu-sovereign zone", () => {
      expect(isProviderAllowed("eu-sovereign", "telnyx")).toBe(true);
      expect(isProviderAllowed("eu-sovereign", "sinch")).toBe(false);
    });

    it("allows all providers in global zone", () => {
      expect(isProviderAllowed("global", "sinch")).toBe(true);
      expect(isProviderAllowed("global", "telnyx")).toBe(true);
    });

    it("defaults to true for unknown zones", () => {
      expect(isProviderAllowed("unknown-zone", "sinch")).toBe(true);
    });
  });

  describe("getProvidersForZone", () => {
    it("returns allowed providers for zone", () => {
      expect(getProvidersForZone("us-east-tribal")).toContain("sinch");
      expect(getProvidersForZone("us-east-tribal")).toContain("telnyx");
      expect(getProvidersForZone("eu-sovereign")).toContain("telnyx");
      expect(getProvidersForZone("eu-sovereign")).not.toContain("sinch");
    });

    it("returns global providers for unknown zone", () => {
      const providers = getProvidersForZone("unknown");
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe("getZoneConfig", () => {
    it("returns zone configuration", () => {
      const config = getZoneConfig("us-east-tribal");
      expect(config).toBeDefined();
      expect(config.regions).toContain("US");
      expect(config.providers).toBeDefined();
    });

    it("returns null for unknown zone", () => {
      expect(getZoneConfig("unknown-zone")).toBeNull();
    });
  });

  describe("listZones", () => {
    it("returns all zone configurations", () => {
      const zones = listZones();
      expect(zones["us-east-tribal"]).toBeDefined();
      expect(zones["eu-sovereign"]).toBeDefined();
      expect(zones["global"]).toBeDefined();
    });
  });
});
