// src/controllers/webhookController.js

const WebhookEvent = require("../models/WebhookEvent");
const outboundFaxService = require("../services/outboundFaxService");
const providerWebhookNormalizer = require("../services/providerWebhookNormalizer");
const audit = require("../utils/auditLogger");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * POST /webhook/provider
   * Receives webhook from fax provider
   */
  async receive(req, res, next) {
    try {
      const rawPayload = req.body;

      // Normalize provider payload → FaxNova format
      const normalized = providerWebhookNormalizer.normalize(rawPayload);

      const {
        faxId,
        provider,
        providerFaxId,
        status,
        externalEventId,
        error
      } = normalized;

      if (!externalEventId) {
        throw new FaxNovaError("externalEventId is required", {
          code: "EXTERNAL_EVENT_ID_REQUIRED"
        });
      }

      // Idempotency check
      const existing = await WebhookEvent.findOne({ externalEventId });
      if (existing) {
        audit.log("webhookEventDuplicateReceived", {
          externalEventId,
          provider
        });

        return res.status(200).json({
          ok: true,
          duplicate: true
        });
      }

      // Save event
      const event = await WebhookEvent.create({
        faxId,
        provider,
        providerFaxId,
        status,
        externalEventId,
        error,
        raw: rawPayload,
        createdAt: new Date()
      });

      audit.log("webhookEventReceived", {
        faxId,
        provider,
        status,
        externalEventId
      });

      // Update fax status
      if (faxId && status) {
        await outboundFaxService.updateStatus(faxId, status);

        audit.log("faxStatusUpdatedFromWebhook", {
          faxId,
          status,
          provider
        });
      }

      res.status(200).json({
        ok: true,
        event
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /webhook/events
   * Returns recent webhook events
   */
  async list(req, res, next) {
    try {
      const events = await WebhookEvent.find()
        .sort({ createdAt: -1 })
        .limit(200);

      audit.log("webhookEventsViewed", {
        user: req.user?.id
      });

      res.status(200).json(events);
    } catch (err) {
      next(err);
    }
  }
};
