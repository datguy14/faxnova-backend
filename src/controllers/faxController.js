const Fax = require('../models/Fax')
const audit = require('../audit/auditService')
const faxRouter = require('../integrations/faxRouter')
const logger = require('../utils/logger')

/**
 * SEND FAX (Provider-Aware)
 */
exports.sendFax = async (req, res) => {
  const { to, fileUrl, from, provider } = req.body

  // ------------------------------
  // AUDIT: Send attempt
  // ------------------------------
  audit.logEvent({
    tenantId: req.tenantId,
    type: 'fax',
    action: 'send_attempt',
    correlationId: req.correlationId,
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
    tier: req.apiTier,
    details: {
      to,
      fileUrl,
      provider: provider || process.env.DEFAULT_FAX_PROVIDER
    }
  })

  try {
    // Route to correct provider (sinch | telnyx)
    const result = await faxRouter.sendFax({
      to,
      fileUrl,
      from: from || undefined,
      provider
    })

    // Save fax record
    const faxRecord = await Fax.create({
      tenantId: req.tenantId,
      apiKeyId: req.apiKeyId,
      direction: 'outbound',
      to,
      from:
        from ||
        (result.provider === 'sinch'
          ? process.env.SINCH_FAX_NUMBER
          : process.env.TELNYX_FROM_NUMBER),
      status: 'queued',
      provider: result.provider,
      providerFaxId: result.id || result.faxId,
      pages: result.pages || null,
      metadata: {
        correlationId: req.correlationId
      }
    })

    // ------------------------------
    // AUDIT: Send success
    // ------------------------------
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
        providerFaxId: result.id || result.faxId,
        provider: result.provider,
        to
      }
    })

    return res.json({
      success: true,
      faxId: faxRecord._id,
      providerFaxId: result.id || result.faxId,
      provider: result.provider,
      status: 'queued',
      correlationId: req.correlationId
    })
  } catch (err) {
    logger.error('Fax send error', {
      error: err.message,
      to,
      provider: req.body.provider
    })

    // ------------------------------
    // AUDIT: Send failure
    // ------------------------------
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
        fileUrl,
        provider: req.body.provider
      }
    })

    return res.status(500).json({
      success: false,
      error: 'Failed to send fax',
      correlationId: req.correlationId,
      details:
        process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
}

/**
 * GET FAX STATUS (Provider-Aware)
 */
exports.getFaxStatus = async (req, res) => {
  const { id } = req.params

  try {
    const faxRecord = await Fax.findById(id)
    if (!faxRecord) {
      return res
        .status(404)
        .json({ success: false, error: 'Fax record not found' })
    }

    // Fetch latest status from correct provider
    const statusResult = await faxRouter.getStatus(
      faxRecord.providerFaxId,
      faxRecord.provider
    )

    // Update DB with latest status
    faxRecord.status = statusResult.status || faxRecord.status
    await faxRecord.save()

    return res.json({
      success: true,
      faxId: faxRecord._id,
      providerFaxId: faxRecord.providerFaxId,
      provider: faxRecord.provider,
      status: faxRecord.status,
      details: statusResult
    })
  } catch (err) {
    logger.error('Get fax status error', {
      faxId: id,
      error: err.message
    })

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve fax status',
      correlationId: req.correlationId
    })
  }
}
