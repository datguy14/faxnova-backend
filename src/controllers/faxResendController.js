// src/controllers/faxResendController.js

const axios = require('axios');
const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.resendFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;

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
        details: { faxId }
      });

      return res.status(404).json({
        success: false,
        error: 'Fax not found',
        correlationId: req.correlationId
      });
    }

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
        providerFaxId: originalFax.providerFaxId
      }
    });

    // Send new fax using original data
    const response = await axios.post(
      `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes`,
      {
        to: originalFax.to,
        from: originalFax.from,
        fileUrl: originalFax.fileUrl
      },
      {
        auth: {
          username: process.env.SINCH_KEY_ID,
          password: process.env.SINCH_KEY_SECRET
        },
        headers: {
          'X-Correlation-ID': req.correlationId
        }
      }
    );

    // Create new fax record
    const newFax = await Fax.create({
      tenantId: originalFax.tenantId,
      apiKeyId: originalFax.apiKeyId,
      direction: 'outbound',
      to: originalFax.to,
      from: originalFax.from,
      fileUrl: originalFax.fileUrl,
      status: 'queued',
      providerFaxId: response.data.id,
      metadata: {
        correlationId: req.correlationId,
        resentFromFaxId: originalFax._id
      }
    });

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
        newProviderFaxId: response.data.id
      }
    });

    res.json({
      success: true,
      message: 'Fax resent successfully',
      originalFaxId: faxId,
      newFaxId: newFax._id,
      providerFaxId: response.data.id,
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('Fax resend error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'resend_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resend fax',
      correlationId: req.correlationId
    });
  }
};
