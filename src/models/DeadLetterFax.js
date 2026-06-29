// src/models/DeadLetterFax.js

const mongoose = require("mongoose");

const DeadLetterFaxSchema = new mongoose.Schema({
  faxId: { type: String, required: true },
  provider: { type: String },
  region: { type: String },
  attempts: { type: Number },
  lastError: { type: String },
  payload: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DeadLetterFax", DeadLetterFaxSchema);
