// src/controllers/apiKeyController.js

const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const audit = require('../audit/auditService');

exports.createApiKey = async (req, res) => {
  try {
    const { label, tier } = req.body;

    // Generate raw key
    const rawKey = `fn_live_${crypto.randomBytes(16).toString('hex')}`;

    // Hash key for storage
    const keyHash = crypto
      .createHmac('sha256', process.env.API_KEY_HASH_SECRET)
      .update(rawKey)
      .digest('hex');

    // Create API key record
    const apiKey = await ApiKey.create({
      tenantId: req.tenantId,
      keyHash,
      label,
      tier,
      status: 'active',
      limits: {
        maxPerMinute: req.rateLimits.perMinute,
        maxPerDay: req.rateLimits.perDay
      }
    });

    // -----------------------------
    // AUDIT: API key created
    // -----------------------------
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'apikey',
      action: 'api_key_created',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        apiKeyId: apiKey._id,
        label,
        tier
      }
    });

    res.json({
      success: true,
      apiKey: rawKey, // only time the raw key is shown
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('API key creation error:', err.message);

    // -----------------------------
    // AUDIT: API key creation failed
    // -----------------------------
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'apikey',
      action: 'api_key_creation_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
      correlationId: req.correlationId
    });
  }
};
