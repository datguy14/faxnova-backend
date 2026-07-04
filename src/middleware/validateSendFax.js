// src/middleware/validateSendFax.js

module.exports = (req, res, next) => {
  const { to, region, storageKey } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: to"
    });
  }

  if (!region) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: region"
    });
  }

  if (!storageKey) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: storageKey"
    });
  }

  next();
};
