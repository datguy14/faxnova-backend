// src/models/AdminNotification.js

const mongoose = require("mongoose");

const AdminNotificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // SLA_VIOLATION, FAILOVER_TRIGGERED, etc.
  message: { type: String, required: true },
  details: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  severity: { type: String, default: "info" }, // info | warning | critical
}, { timestamps: true });

module.exports = mongoose.model("AdminNotification", AdminNotificationSchema);
