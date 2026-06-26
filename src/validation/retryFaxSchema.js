// src/validation/retryFaxSchema.js

const { z } = require("zod");

const retryFaxSchema = z.object({
  faxId: z.string().min(1, "faxId is required")
});

module.exports = { retryFaxSchema };
