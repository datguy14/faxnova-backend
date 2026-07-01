// src/schemas/faxSchemas.js

const { z } = require("zod");

const safeUrlRegex = /^https:\/\/[a-zA-Z0-9.-]+\/.+/;

exports.createFaxSchema = z.object({
  tenantId: z.string().min(1).max(64),

  to: z.string()
    .min(7)
    .max(32)
    .regex(/^\+?[0-9]+$/, "Fax number must be numeric"),

  from: z.string()
    .min(7)
    .max(32)
    .regex(/^\+?[0-9]+$/, "Fax number must be numeric"),

  documentUrl: z.string()
    .url("Invalid document URL")
    .regex(safeUrlRegex, "Document URL must be HTTPS and publicly accessible"),

  metadata: z.record(z.any()).optional()
});
