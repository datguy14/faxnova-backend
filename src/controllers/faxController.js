// src/controllers/faxController.js
const Fax = require("../models/Fax");

module.exports = {
  async createOutbound(req, res) {
    try {
      const fax = await Fax.create({
        direction: "outbound",
        ...req.body
      });
      res.status(201).json(fax);
    } catch (err) {
      res.status(400).json({ error: "Failed to create fax" });
    }
  },

  async getById(req, res) {
    try {
      const fax = await Fax.findById(req.params.id);
      if (!fax) return res.status(404).json({ error: "Not found" });
      res.json(fax);
    } catch (err) {
      res.status(400).json({ error: "Invalid ID" });
    }
  }
};
