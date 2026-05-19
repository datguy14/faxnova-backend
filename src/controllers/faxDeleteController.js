// src/controllers/faxDeleteController.js

const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.deleteFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;

    // Lookup fax
    const fax = await Fax.findOne({
      _id: faxId,
      tenantId: req.tenantId
    });

    if (!fax) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: 'fax',
        action: 'delete_failed_not_found',
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

    // Delete fax
    await Fax.deleteOne({ _id: faxId });

    // Audit: delete success
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'delete_success',
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

    res.json({
      success: true,
      message: 'Fax deleted successfully',
      faxId,
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('Fax delete error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'delete_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete fax',
      correlationId: req.correlationId
    });
  }
};
