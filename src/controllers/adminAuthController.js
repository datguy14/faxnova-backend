const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auditService = require("../services/auditService");

module.exports = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { adminId: admin._id, role: admin.role },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: "12h" }
      );

      await AdminSession.create({
        adminId: admin._id,
        token,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      });

      await auditService.logEvent({
        type: "ADMIN_LOGIN",
        details: { adminId: admin._id, email }
      });

      res.json({ ok: true, token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
