// src/controllers/faxController.js

const axios = require('axios');
const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.sendFax = async (req, res) => {
  const { to, fileUrl } = req.body;

  // -----------------------------
  // AUDIT: Send attempt
  // -----------------------------
  audit.logEvent({
    tenantId: req.tenantId,
    type: 'fax',
    action: 'send_attempt',
    correlationId: req.correlationId,
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
    tier: req.apiTier,
    details: { to, fileUrl }
  });

  try {
    const response = await axios.post(
      `https://fax.${process.env.SINCH_REGION}.sinch.com/v1/faxes`,
      {
        to,
        from: process.env.SINCH_FAX_NUMBER,
        fileUrl
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.SINCH_API_KEY}:${process.env.SINCH_API_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save fax record in MongoDB
    const faxRecord = await Fax.create({
      tenantId: req.tenantId,
      apiKeyId: req.apiKeyId,
      direction: 'outbound',
      to,
      from: process.env.SINCH_FAX_NUMBER,
      status: 'queued',
      providerFaxId: response.data.id,
      pages: response.data.pages || null,
      metadata: {
        correlationId: req.correlationId
      }
    });

    // -----------------------------
    // AUDIT: Send success
    // -----------------------------
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'send_success',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        faxId: faxRecord._id,
        providerFaxId: response.data.id,
        to
      }
    });

    res.json({
      success: true,
      faxId: response.data.id,
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('Fax send error:', err.message);

    // -----------------------------
    // AUDIT: Send failure
    // -----------------------------
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'send_failure',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        error: err.message,
        to,
        fileUrl
      }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send fax',
      correlationId: req.correlationId
    });
  }
};
