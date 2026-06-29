const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");

router.post("/send", auth, async (req, res) => {
  // send fax logic
});

router.get("/:id", auth, async (req, res) => {
  // get fax status
});

module.exports = router;
