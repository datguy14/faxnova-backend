const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", auth, requireAdmin, async (req, res) => {
  // list inbound faxes
});

module.exports = router;
