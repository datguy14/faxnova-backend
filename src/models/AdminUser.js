// src/models/AdminUser.js

const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }
});

module.exports = mongoose.model("AdminUser", AdminUserSchema);
