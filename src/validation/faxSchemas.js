const { sendFaxSchema } = require("../validation/faxSchemas");

async function sendFax(req, res, next) {
  try {
    const validated = sendFaxSchema.parse(req.body);
    // ... use validated.tenantId, validated.to, etc.
  } catch (err) {
    next(err); // ZodError caught by errorHandler
  }
}
