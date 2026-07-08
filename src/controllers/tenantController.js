// src/controllers/tenantController.js — Unified Fax Architecture (CommonJS Only)

const Tenant = require("../models/Tenant");

module.exports = {
  async createTenant(req, res) {
    try {
      const { name, apiKey, residencyZone, tier, providers } = req.body;

      const tenant = await Tenant.create({
        name,
        apiKey,
        residencyZone,
        tier,
        providers
      });

      res.json(tenant);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listTenants(req, res) {
    try {
      const tenants = await Tenant.find();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      res.json(tenant);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
