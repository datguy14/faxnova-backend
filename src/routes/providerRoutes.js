const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/authMiddleware");

router.get("/health", auth, requireAdmin, async (req, res) => {
  // provider health logic
});

router.get("/scores", auth, requireAdmin, async (req, res) => {
  // provider score logic
});

module.exports = router;
