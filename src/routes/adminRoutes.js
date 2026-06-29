const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/authMiddleware");

router.get("/dashboard", auth, requireAdmin, async (req, res) => {
  res.json({ message: "Admin dashboard", user: req.user });
});

module.exports = router;
