const mongoose = require("mongoose");

const AdminSessionSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("AdminSession", AdminSessionSchema);
