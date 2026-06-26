// src/controllers/faxController.js

const { faxSendSchema } = require("../validation/faxSchemas");
const sendFaxService = require("../services/sendFaxService");

module.exports = {
  async sendFax(req, res, next) {
    try {
      const parsed = faxSendSchema.parse(req.body); // ✔ validate input
      const result = await sendFaxService.sendFax(parsed);
      res.status(201).json(result);
    } catch (err) {
      next(err); // Zod errors flow into global error handler
    }
  }
};
