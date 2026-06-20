const { sendFaxService } = require("../services/sendFaxService.js");
const { faxStatusService } = require("../services/faxStatusService.js");
const { faxRetryService } = require("../services/faxRetryService.js");
const auditService = require("../services/auditService.js");

/**
 * POST /fax/send
 * Send a fax using provider routing, residency rules, and failover logic.
 */
async function sendFax(req, res, next) {
  try {
    const { to, from, documentUrl, metadata } = req.body;

    const fax = await sendFaxService({
      to,
      from,
      documentUrl,
      metadata,
      tenantId: req.tenantId,
      userId: req.userId
    });

    await auditService.logEvent({
      action: "FAX_SENT",
      tenantId: req.tenantId,
      userId: req.userId,
      faxId: fax._id,
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
async function getFaxStatus(req, res, next) {
  try {
    const faxId = req.params.id;

    const status = await faxStatusService({
      faxId,
      tenantId: req.tenantId
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
async function retryFax(req, res, next) {
  try {
    const faxId = req.params.id;

    const result = await faxRetryService({
      faxId,
      tenantId: req.tenantId,
      userId: req.userId
    });

    await auditService.logEvent({
      action: "FAX_RETRY",
      tenantId: req.tenantId,
      userId: req.userId,
      faxId
    });

    res.json({ faxId, result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendFax,
  getFaxStatus,
  retryFax
};
