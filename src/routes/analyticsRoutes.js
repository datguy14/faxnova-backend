const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/authMiddleware");

router.get("/stats", auth, requireAdmin, async (req, res) => {
  // analytics logic
  res.json({ ok: true });
});

module.exports = router;
