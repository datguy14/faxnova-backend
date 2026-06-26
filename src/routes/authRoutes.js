const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing admin token" });
  }

  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_ADMIN_SECRET);
    if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/admin/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  // Replace with real user store
  if (username === "root" && password === "changeme") {
    const token = jwt.sign({ role: "admin", username }, JWT_ADMIN_SECRET, {
      expiresIn: "1h"
    });
    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

router.get("/admin/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
