// src/controllers/faxRetryController.js

const Fax = require('../models/Fax');
const { retryFax } = require('../services/faxRetryService');
const audit = require('../audit/auditService');

exports.retryFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;

    // Lookup fax in DB
    const fax = await Fax.findOne({
      _id: faxId,
      tenantId: req.tenantId
    });

    if (!fax) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: 'fax',
        action: 'retry_failed_not_found',
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { faxId }
      });

      return res.status(404).json({
        success: false,
        error: 'Fax not found',
        correlationId: req.correlationId
      });
    }

    // Audit: retry attempt
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'retry_attempt',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        faxId,
        providerFaxId: fax.providerFaxId
      }
    });

    // Call Sinch retry API
    const result = await retryFax(fax.providerFaxId, req.correlationId);

    // Update fax record
    fax.status = result.status || 'queued';
    fax.metadata.lastRetryAt = new Date();
    await fax.save();

    // Audit: retry success
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'retry_success',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        faxId,
        providerFaxId: fax.providerFaxId,
        newStatus: fax.status
      }
    });

    res.json({
      success: true,
      message: 'Fax retry initiated',
      faxId,
      providerFaxId: fax.providerFaxId,
      status: fax.status,
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('Retry error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'retry_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retry fax',
      correlationId: req.correlationId
    });
  }
};
