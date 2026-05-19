// src/controllers/inboundFaxController.js

const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.handleInboundFax = async (req, res) => {
  try {
    const payload = req.body;

    const {
      id: providerFaxId,
      from,
      to,
      fileUrl,
      pages,
      status,
      metadata
    } = payload;

    // Determine tenant by inbound fax number
    const tenantId = await Fax.resolveTenantByInboundNumber(to);

    // Audit: inbound fax received
    audit.logEvent({
      tenantId,
      type: 'fax',
      action: 'inbound_received',
      correlationId: metadata?.correlationId || null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: {
        providerFaxId,
        from,
        to,
        pages,
        status
      }
    });

    // Save inbound fax record
    const faxRecord = await Fax.create({
      tenantId,
      direction: 'inbound',
      from,
      to,
      fileUrl,
      pages,
      status,
      providerFaxId,
      metadata: {
        correlationId: metadata?.correlationId || null
      }
    });

    // Audit: inbound fax stored
    audit.logEvent({
      tenantId,
      type: 'fax',
      action: 'inbound_stored',
      correlationId: metadata?.correlationId || null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: {
        faxId: faxRecord._id,
        providerFaxId
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error('Inbound fax error:', err.message);

    audit.logEvent({
      tenantId: null,
      type: 'fax',
      action: 'inbound_failed',
      correlationId: null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Inbound fax processing failed'
    });
  }
};
