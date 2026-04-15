const { getFaxStatus } = require('../services/faxStatusService');

exports.checkFaxStatus = async (req, res) => {
  try {
    const { faxId } = req.params;

    if (!faxId) {
      return res.status(400).json({ error: "Missing faxId" });
    }

    const status = await getFaxStatus(faxId);

    res.json({
      faxId: status.id,
      status: status.status,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt
    });

  } catch (error) {
    console.error("Status error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to retrieve fax status",
      details: error.response?.data || error.message
    });
  }
};
