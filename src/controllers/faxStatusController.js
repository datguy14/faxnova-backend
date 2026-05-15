// src/controllers/faxStatusController.js
const { getFaxStatus } = require('../services/faxStatusService');

exports.checkFaxStatus = async (req, res, next) => {
  try {
    const { faxId } = req.params;

    const status = await getFaxStatus(faxId);

    res.json({
      success: true,
      faxId: status.id,
      status: status.status,
      createdAt: status.createTime || null,
      updatedAt: status.completedTime || null,
      correlationId: req.correlationId
    });

  } catch (error) {
    next({
      status: error.status || 500,
      message: error.message,
      details: error.details || null,
      correlationId: req.correlationId
    });
  }
};
