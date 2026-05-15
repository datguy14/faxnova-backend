// src/controllers/faxController.js
const { sendFax } = require('../services/sendFaxService');

exports.sendFax = async (req, res, next) => {
  try {
    const payload = {
      from: process.env.SINCH_FAX_NUMBER,
      to: Array.isArray(req.body.to) ? req.body.to : [req.body.to],
      media: [{ url: req.body.fileUrl }]
    };

    const correlationId = req.correlationId;

    const result = await sendFax(payload, correlationId);

    res.status(201).json({
      success: true,
      faxId: result.id,
      status: result.status,
      correlationId
    });

  } catch (error) {
    next({
      status: error.status || 500,
      message: error.message || 'Fax send failed',
      details: error.details || null,
      payload: req.body,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
};
