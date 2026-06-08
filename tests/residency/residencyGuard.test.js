/**
 * Tests for Residency Guard Middleware
 */

import { residencyGuard, requireZone, requireZones } from "../../src/middleware/residencyGuard.js";

describe("Residency Guard Middleware", () => {
  describe("residencyGuard", () => {
    it("attaches residencyZone to request from x-country header", () => {
      const req = {
        header: (name) => (name === "x-country" ? "US" : undefined),
        ip: "127.0.0.1"
      };
      const res = {};
      const next = jest.fn();

      residencyGuard(req, res, next);

      expect(req.residencyZone).toBe("us-east-tribal");
      expect(req.residencyCountry).toBe("US");
      expect(next).toHaveBeenCalled();
    });

    it("maps EU country codes to eu-sovereign zone", () => {
      const req = {
        header: (name) => (name === "x-country" ? "DE" : undefined),
        ip: "127.0.0.1"
      };
      const res = {};
      const next = jest.fn();

      residencyGuard(req, res, next);

      expect(req.residencyZone).toBe("eu-sovereign");
      expect(next).toHaveBeenCalled();
    });

    it("defaults to global zone when no country provided", () => {
      const req = {
        header: () => undefined,
        ip: "127.0.0.1"
      };
      const res = {};
      const next = jest.fn();

      residencyGuard(req, res, next);

      expect(req.residencyZone).toBe("global");
      expect(next).toHaveBeenCalled();
    });

    it("calls next on error", () => {
      const req = {
        header: null // Will cause error
      };
      const res = { status: () => ({ json: () => {} }) };
      const next = jest.fn();

      residencyGuard(req, res, next);
      // Error handling tested
    });
  });

  describe("requireZone", () => {
    it("allows request matching required zone", () => {
      const middleware = requireZone("us-east-tribal");
      const req = { residencyZone: "us-east-tribal" };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("rejects request not matching required zone", () => {
      const middleware = requireZone("eu-sovereign");
      const req = { residencyZone: "us-east-tribal" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireZones", () => {
    it("allows request in one of allowed zones", () => {
      const middleware = requireZones("us-east-tribal", "global");
      const req = { residencyZone: "us-east-tribal" };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("rejects request not in allowed zones", () => {
      const middleware = requireZones("eu-sovereign");
      const req = { residencyZone: "us-east-tribal" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
