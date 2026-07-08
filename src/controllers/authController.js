const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

module.exports = {
  async registerAdmin(req, res) {
    try {
      const { email, password } = req.body;

      const existing = await AdminUser.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Admin already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const admin = await AdminUser.create({ email, passwordHash });

      res.json({ _id: admin._id, email: admin.email });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;

      const admin = await AdminUser.findOne({ email });
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, admin.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { adminId: admin._id.toString(), role: admin.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
