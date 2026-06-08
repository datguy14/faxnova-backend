// src/controllers/inboundFaxController.js

const Fax = require('../models/Fax');
const audit = require('../audit/auditService');
const { writeResidencyLog } = require('../storage/residencyStorage');
const { getResidencyZone } = require('../residency/policy');

exports.handleInboundFax = async (req, res) => {
  try {
    const payload = req.body;
    const residencyZone = req.residencyZone || 'global';

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

    // Extract country from inbound number if possible
    const countryCode = metadata?.countryCode || null;
    const faxZone = countryCode ? getResidencyZone(countryCode) : residencyZone;

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
        status,
        residencyZone: faxZone
      }
    });

    // Save inbound fax record with residency metadata
    const faxRecord = await Fax.create({
      tenantId,
      direction: 'inbound',
      from,
      to,
      fileUrl,
      pages,
      status,
      faxId: providerFaxId,
      residencyZone: faxZone,
      provider: 'inbound', // Mark as inbound fax
      metadata: {
        correlationId: metadata?.correlationId || null,
        countryCode
      }
    });

    // Log to residency storage
    await writeResidencyLog(
      faxZone,
      'inbound-received.log',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        faxId: faxRecord._id,
        providerFaxId,
        from,
        to,
        pages,
        status,
        residencyZone: faxZone
      })
    );

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
        providerFaxId,
        residencyZone: faxZone
      }
    });

    res.json({ 
      success: true,
      faxId: faxRecord._id,
      residencyZone: faxZone
    });

  } catch (err) {
    console.error('Inbound fax error:', err.message);
    const residencyZone = req.residencyZone || 'global';

    // Log error to residency storage
    try {
      await writeResidencyLog(
        residencyZone,
        'inbound-errors.log',
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
      tenantId: null,
      type: 'fax',
      action: 'inbound_failed',
      correlationId: null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: { error: err.message, residencyZone }
    });

    res.status(500).json({
      success: false,
      error: 'Inbound fax processing failed',
      residencyZone
    });
  }
};
