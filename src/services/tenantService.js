// src/services/tenantService.js

/**
 * tenantService
 *
 * Responsibilities:
 * - Resolve tenant by inbound fax number
 * - Validate tenant ownership of numbers
 * - Provide lookup utilities for controllers/services
 *
 * FaxNova v1 uses a simple MongoDB collection:
 * TenantNumber: { tenantId, number }
 */

const TenantNumber = require("../models/TenantNumber");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Resolve tenant by inbound number.
   *
   * @param {string} number - E.164 formatted number
   * @returns {string|null} tenantId
   */
  async resolveTenantByNumber(number) {
    try {
      const record = await TenantNumber.findOne({ number });

      return record ? record.tenantId : null;
    } catch (err) {
      throw new FaxNovaError("Failed to resolve tenant by number", {
        code: "TENANT_LOOKUP_ERROR",
        number,
        details: err.message
      });
    }
  },

  /**
   * Validate that a tenant owns a given number.
   *
   * Used for:
   * - Outbound fax validation
   * - Admin number assignment tools
   */
  async tenantOwnsNumber(tenantId, number) {
    try {
      const record = await TenantNumber.findOne({ tenantId, number });
      return !!record;
    } catch (err) {
      throw new FaxNovaError("Failed to validate tenant number ownership", {
        code: "TENANT_NUMBER_OWNERSHIP_ERROR",
        tenantId,
        number,
        details: err.message
      });
    }
  },

  /**
   * Assign a number to a tenant.
   *
   * Used by admin tools or provisioning scripts.
   */
  async assignNumberToTenant(tenantId, number) {
    try {
      const exists = await TenantNumber.findOne({ number });

      if (exists) {
        throw new FaxNovaError("Number already assigned to a tenant", {
          code: "NUMBER_ALREADY_ASSIGNED",
          tenantId: exists.tenantId,
          number
        });
      }

      return await TenantNumber.create({ tenantId, number });
    } catch (err) {
      throw new FaxNovaError("Failed to assign number to tenant", {
        code: "TENANT_NUMBER_ASSIGN_ERROR",
        tenantId,
        number,
        details: err.message
      });
    }
  }
};
