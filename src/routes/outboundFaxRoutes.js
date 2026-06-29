const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");

router.post("/", auth, async (req, res) => {
  // create outbound fax
});

router.get("/:id", auth, async (req, res) => {
  // fetch outbound fax
});

module.exports = router;
