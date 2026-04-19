const { getFaxStatus } = require('../services/faxStatusService');

exports.checkFaxStatus = async (req, res, next) => {
  try {
    const { faxId } = req.params;

    const status = await getFaxStatus(faxId);

    res.json({
      faxId: status.id,
      status: status.status,
      createdAt: status.createTime || null,
      updatedAt: status.completedTime || null,
      correlationId: req.correlationId
    });

  } catch (error) {
    next({
      status: error.response?.status || 500,
      message: 'Failed to retrieve fax status',
      details: error.response?.data || error.message
    });
  }
};
