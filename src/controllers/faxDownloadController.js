// src/controllers/faxDownloadController.js

const axios = require('axios');
const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.downloadFaxController = async (req, res) => {
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
        action: 'download_failed_not_found',
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

    if (!fax.fileUrl) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: 'fax',
        action: 'download_failed_no_file',
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { faxId }
      });

      return res.status(400).json({
        success: false,
        error: 'Fax has no downloadable file',
        correlationId: req.correlationId
      });
    }

    // Audit: download attempt
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'download_attempt',
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

    // Stream file from remote URL
    const fileResponse = await axios.get(fax.fileUrl, {
      responseType: 'stream'
    });

    // Set headers for download
    res.setHeader('Content-Type', fileResponse.headers['content-type']);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fax-${faxId}.pdf"`
    );

    // Audit: download success
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'download_success',
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

    // Pipe file to client
    fileResponse.data.pipe(res);

  } catch (err) {
    console.error('Fax download error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'fax',
      action: 'download_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to download fax',
      correlationId: req.correlationId
    });
  }
};
