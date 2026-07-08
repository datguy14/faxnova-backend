const outboundFaxService = require("../services/outboundFaxService");

module.exports = {
  async sendFax(req, res) {
    try {
      const { to, pdfBase64 } = req.body;
      const tenantId = req.tenantId;

      if (!to || !pdfBase64) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await outboundFaxService.sendFax({
        tenantId,
        to,
        pdfBase64
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        ok: true,
        faxId: result.faxId,
        provider: result.provider,
        region: result.region
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
