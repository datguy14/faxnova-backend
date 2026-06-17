// src/controllers/fax.controller.js
import { sendFaxService } from "../services/sendFaxService.js";
import { faxStatusService } from "../services/faxStatusService.js";
import { faxRetryService } from "../services/faxRetryService.js";
import { auditService } from "../services/auditService.js";

/**
 * POST /fax/send
 * Send a fax using provider routing, residency rules, and failover logic.
 */
export async function sendFax(req, res, next) {
  try {
    const { to, from, documentUrl, metadata } = req.body;

    const fax = await sendFaxService({
      to,
      from,
      documentUrl,
      metadata,
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    await auditService.log({
      action: "FAX_SENT",
      tenantId: req.user.tenantId,
      userId: req.user.id,
      faxId: fax.id,
      details: { to, from }
    });

    res.status(201).json({ fax });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /fax/:id
 * Retrieve fax status (queued, sending, sent, failed).
 */
export async function getFaxStatus(req, res, next) {
  try {
    const faxId = req.params.id;

    const status = await faxStatusService({
      faxId,
      tenantId: req.user.tenantId
    });

    res.json({ faxId, status });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /fax/:id/retry
 * Retry a failed fax using provider failover logic.
 */
export async function retryFax(req, res, next) {
  try {
    const faxId = req.params.id;

    const result = await faxRetryService({
      faxId,
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    await auditService.log({
      action: "FAX_RETRY",
      tenantId: req.user.tenantId,
      userId: req.user.id,
      faxId
    });

    res.json({ faxId, result });
  } catch (err) {
    next(err);
  }
}
