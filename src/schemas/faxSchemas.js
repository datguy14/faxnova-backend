// src/schemas/faxSchemas.js

const { z } = require("zod");

//
// Outbound Fax Schema
//
exports.outboundFaxSchema = z.object({
  to: z.string().min(1, "Recipient fax number is required"),
  region: z.string().min(1, "Region is required"),
  storageKey: z.string().min(1, "storageKey is required")
});

//
// Inbound Fax Schema
//
exports.inboundFaxSchema = z.object({
  providerFaxId: z.string().min(1, "providerFaxId is required"),
  from: z.string().min(1, "Sender fax number is required"),
  region: z.string().min(1, "Region is required"),
  storageKey: z.string().min(1, "storageKey is required")
});

//
// Fax Status Update Schema (webhooks)
//
exports.faxStatusSchema = z.object({
  providerFaxId: z.string().min(1, "providerFaxId is required"),
  status: z.string().min(1, "Status is required"),
  errorMessage: z.string().optional()
});
