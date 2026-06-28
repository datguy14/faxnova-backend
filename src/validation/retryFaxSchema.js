// src/validation/retryFaxSchema.js

const { z } = require("zod");

/**
 * Retry Fax Zod Schema (FaxNova v1)
 *
 * Validates:
 * - faxId (MongoDB ObjectId string)
 */

const retryFaxSchema = z.object({
  faxId: z
    .string({
      required_error: "faxId is required"
    })
    .regex(/^[a-f\d]{24}$/i, "Invalid faxId format")
});

module.exports = {
  retryFaxSchema
};
