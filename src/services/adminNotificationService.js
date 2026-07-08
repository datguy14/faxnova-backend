// src/services/adminNotificationService.js

const AdminNotification = require("../models/AdminNotification");

module.exports = {
  async createNotification({ type, message, severity = "info", details = {} }) {
    return await AdminNotification.create({
      type,
      message,
      severity,
      details
    });
  },

  async getNotifications() {
    return await AdminNotification.find().sort({ createdAt: -1 }).limit(200);
  },

  async markAsRead(notificationId) {
    return await AdminNotification.findByIdAndUpdate(notificationId, { read: true });
  }
};
