// src/validation/faxSendSchema.js

const { z } = require("zod");

const faxSendSchema = z.object({
  to: z.string().min(3, "Recipient fax number required"),
  from: z.string().min(3, "Sender fax number required"),
  pages: z.number().int().positive().max(200).optional(),

  documentUrl: z
    .string()
    .url("documentUrl must be a valid URL")
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://"),
      "documentUrl must be http or https"
    )
    .refine(
      (url) =>
        !url.includes("localhost") &&
        !url.includes("127.0.0.1") &&
        !url.includes("0.0.0.0") &&
        !url.includes("::1"),
      "documentUrl cannot point to internal or loopback addresses"
    )
});

module.exports = { faxSendSchema };
