// src/middleware/validateFaxId.js

const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  const { faxId } = req.params;

  if (!faxId) {
    return res.status(400).json({
      success: false,
      error: "Missing faxId parameter"
    });
  }

  if (!mongoose.Types.ObjectId.isValid(faxId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid faxId format"
    });
  }

  next();
};
