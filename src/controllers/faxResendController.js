// src/controllers/faxResendController.js

const axios = require('axios');
const Fax = require('../models/Fax');
const audit = require('../audit/auditService');
const { routeFax } = require('../services/providerRouter');
const { writeResidencyLog } = require('../storage/residencyStorage');

exports.resendFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;
    const residencyZone = req.residencyZone || 'global';

    // Lookup original fax
    const originalFax = await Fax.findOne({
      _id: faxId,
      tenantId: req.tenantId
    });

    if (!originalFax) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: 'fax',
        action: 'resend_failed_not_found',
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
        'resend-errors.log',
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

    // Use stored residency zone if available, otherwise use request zone
    const faxZone = originalFax.residencyZone || residencyZone;

    // Audit: resend attempt
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'resend_attempt',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        faxId,
        providerFaxId: originalFax.providerFaxId,
        residencyZone: faxZone
      }
    });

    // Route through residency-compliant provider
    const routingResult = await routeFax(
      {
        to: originalFax.to,
        from: originalFax.from,
        fileUrl: originalFax.fileUrl,
        preferredProvider: originalFax.primaryProvider
      },
      faxZone
    );

    // Create new fax record with residency metadata
    const newFax = await Fax.create({
      tenantId: originalFax.tenantId,
      apiKeyId: originalFax.apiKeyId,
      direction: 'outbound',
      to: originalFax.to,
      from: originalFax.from,
      fileUrl: originalFax.fileUrl,
      status: 'queued',
      faxId: routingResult.id || routingResult.faxId,
      residencyZone: faxZone,
      primaryProvider: routingResult.primaryProvider,
      fallbackProvider: routingResult.fallbackProvider || null,
      failoverUsed: routingResult.failoverUsed || false,
      metadata: {
        correlationId: req.correlationId,
        resentFromFaxId: originalFax._id
      }
    });

    // Log to residency storage
    await writeResidencyLog(
      faxZone,
      'resend-operations.log',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        originalFaxId: faxId,
        newFaxId: newFax._id,
        externalId: routingResult.id || routingResult.faxId,
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false,
        residencyZone: faxZone
      })
    );

    // Audit: resend success
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'resend_success',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        originalFaxId: faxId,
        newFaxId: newFax._id,
        newProviderFaxId: routingResult.id || routingResult.faxId,
        residencyZone: faxZone
      }
    });

    res.json({
      success: true,
      message: 'Fax resent successfully',
      originalFaxId: faxId,
      newFaxId: newFax._id,
      providerFaxId: routingResult.id || routingResult.faxId,
      correlationId: req.correlationId,
      residencyZone: faxZone,
      routing: {
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false
      }
    });

  } catch (err) {
    console.error('Fax resend error:', err.message);
    const residencyZone = req.residencyZone || 'global';

    // Log error to residency storage
    try {
      await writeResidencyLog(
        residencyZone,
        'resend-errors.log',
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
      action: 'resend_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message, residencyZone }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resend fax',
      correlationId: req.correlationId,
      residencyZone
    });
  }
};
