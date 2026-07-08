// src/controllers/outboundFaxController.js — Unified Fax Architecture (CommonJS Only)

const outboundFaxQueue = require("../queues/outboundFaxQueue");
const auditService = require("../services/auditService");

module.exports = {
  /**
   * HTTP endpoint → enqueue outbound fax job
   *
   * Responsibilities:
   * - Validate request payload
   * - Push job into outboundFaxQueue
   * - Log audit event
   * - Return unified response
   */
  async send(req, res) {
    try {
      const {
        tenantId,
        idempotencyKey,
        to,
        from,
        region,
        provider,
        failoverProvider,
        metadata
      } = req.body;

      const pdfBuffer = req.file?.buffer;

      if (!pdfBuffer) {
        return res.status(400).json({
          success: false,
          error: "Missing PDF file buffer"
        });
      }

      // ----------------------------------------
      // 1. Enqueue outbound fax job
      // ----------------------------------------
      const job = await outboundFaxQueue.add("sendFax", {
        tenantId,
        idempotencyKey,
        to,
        from,
        region,
        provider,
        failoverProvider,
        pdfBuffer,
        metadata
      });

      // ----------------------------------------
      // 2. Audit log
      // ----------------------------------------
      await auditService.logEvent({
        tenantId,
        type: "OUTBOUND_FAX_ENQUEUED",
        action: "controller_enqueue",
        provider,
        region,
        details: {
          to,
          from,
          failoverProvider,
          jobId: job.id
        }
      });

      // ----------------------------------------
      // 3. Unified response
      // ----------------------------------------
      return res.json({
        success: true,
        queued: true,
        jobId: job.id,
        provider,
        region
      });
    } catch (err) {
      console.error("OutboundFaxController error:", err.message);

      await auditService.logEvent({
        type: "OUTBOUND_FAX_CONTROLLER_ERROR",
        tenantId: req.body?.tenantId || null,
        provider: req.body?.provider || null,
        region: req.body?.region || null,
        details: { error: err.message }
      });

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
};
