const Fax = require("../models/Fax");
const Tenant = require("../models/Tenant");
const outboundQueue = require("../queues/outboundQueue");
const faxStorageService = require("../storage/faxStorageService");
const auditService = require("./auditService");

module.exports = {
  async sendFax({ tenantId, to, pdfBase64 }) {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return { ok: false, error: "Tenant not found" };
      }

      const buffer = Buffer.from(pdfBase64, "base64");

      const fax = await Fax.create({
        tenantId,
        to,
        region: tenant.residencyZone
      });

      const storageResult = await faxStorageService.storeFax({
        tenantId,
        faxId: fax._id,
        buffer,
        filename: `outbound_${fax._id}.pdf`,
        region: tenant.residencyZone
      });

      if (!storageResult.ok) {
        return { ok: false, error: "Failed to store PDF" };
      }

      fax.storageKey = storageResult.storageKey;
      await fax.save();

      await outboundQueue.add("sendFax", {
        faxId: fax._id,
        tenantId
      });

      await auditService.logEvent({
        type: "OUTBOUND_FAX_CREATED",
        faxId: fax._id,
        tenantId,
        provider: tenant.providers.primary,
        region: tenant.residencyZone,
        details: { to }
      });

      return {
        ok: true,
        faxId: fax._id,
        provider: tenant.providers.primary,
        region: tenant.residencyZone
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
};
