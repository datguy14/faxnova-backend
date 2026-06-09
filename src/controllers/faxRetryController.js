// src/controllers/faxRetryController.js

const Fax = require('../models/Fax');
const { retryFax } = require('../services/faxRetryService');
const { routeFax } = require('../services/providerRouter');
const audit = require('../audit/auditService');
const { writeResidencyLog } = require('../storage/residencyStorage');

exports.retryFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;
    const residencyZone = req.residencyZone || 'global';

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
        details: { faxId, residencyZone }
      });

      // Log to residency storage
      await writeResidencyLog(
        residencyZone,
        'retry-errors.log',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          faxId,
          error: 'Fax not found',
          residencyZone
        })
      );

      return res.status(404).json({
        success: false,
        error: 'Fax not found',
        correlationId: req.correlationId,
        residencyZone
      });
    }

    // Use stored residency zone
    const faxZone = fax.residencyZone || residencyZone;

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
        providerFaxId: fax.faxId,
        residencyZone: faxZone
      }
    });

    // Route through residency-aware provider for retry
    const routingResult = await routeFax(
      {
        to: fax.to,
        from: fax.from || '+1',
        fileUrl: fax.fileUrl,
        preferredProvider: fax.primaryProvider
      },
      faxZone
    );

    // Update fax record with retry metadata
    fax.status = 'queued';
    fax.primaryProvider = routingResult.primaryProvider;
    fax.fallbackProvider = routingResult.fallbackProvider || null;
    fax.failoverUsed = routingResult.failoverUsed || false;
    fax.faxId = routingResult.id || routingResult.faxId;
    
    if (!fax.metadata) fax.metadata = {};
    fax.metadata.lastRetryAt = new Date();
    fax.metadata.retryCount = (fax.metadata.retryCount || 0) + 1;
    
    await fax.save();

    // Log to residency storage
    await writeResidencyLog(
      faxZone,
      'retry-operations.log',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        faxId,
        newProviderFaxId: routingResult.id || routingResult.faxId,
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false,
        retryCount: fax.metadata.retryCount,
        residencyZone: faxZone
      })
    );

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
        providerFaxId: fax.faxId,
        newStatus: fax.status,
        residencyZone: faxZone
      }
    });

    res.json({
      success: true,
      message: 'Fax retry initiated',
      faxId,
      providerFaxId: fax.faxId,
      status: fax.status,
      correlationId: req.correlationId,
      residencyZone: faxZone,
      routing: {
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false
      }
    });

  } catch (err) {
    console.error('Retry error:', err.message);
    const residencyZone = req.residencyZone || 'global';

    // Log error to residency storage
    try {
      await writeResidencyLog(
        residencyZone,
        'retry-errors.log',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: err.message,
          residencyZone
        })
      );
    } catch (logError) {
      console.error('Failed to log error to residency storage:', logError);
    }

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'retry_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message, residencyZone }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retry fax',
      correlationId: req.correlationId,
      residencyZone
    });
  }
};
