// src/services/sendFaxService.js — Updated for Unified Fax Model (CommonJS Only)

const Fax = require("../models/Fax");
const providerApiService = require("./providerApiService");
const idempotencyService = require("./idempotencyService");
const auditService = require("./auditService");

/**
 * Executes the actual provider fax send.
 * Handles:
 * - provider payload shaping
 * - region-aware routing
 * - provider-specific error handling
 * - idempotency updates
 * - audit logging
 */
exports.sendFax = async ({ faxId, provider, region, storageKey, to }) => {
  // ----------------------------------------
  // 1. Load unified Fax record
  // ----------------------------------------
  const fax = await Fax.findById(faxId);
  if (!fax) throw new Error("Fax not found");

  // ----------------------------------------
  // 2. Validate storageKey
  // ----------------------------------------
  if (!storageKey || typeof storageKey !== "string") {
    throw new Error("Invalid storageKey");
  }

  // ----------------------------------------
  // 3. Provider payload shaping
  // ----------------------------------------
  let payload;

  if (provider === "telnyx") {
    payload = {
      to,
      media_url: `https://storage.faxnova.com/${storageKey}`,
      region,
      metadata: {
        faxId,
        tenantId: fax.tenantId
      }
    };
  }

  if (provider === "sinch") {
    payload = {
      to,
      documentUrl: `https://storage.faxnova.com/${storageKey}`,
      region,
      callbackUrl: process.env.SINCH_WEBHOOK_URL,
      reference: faxId
    };
  }

  if (!payload) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // ----------------------------------------
  // 4. Execute provider API call
  // ----------------------------------------
  const result = await providerApiService.sendFax(provider, payload);

  // ----------------------------------------
  // 5. Update unified Fax record
  // ----------------------------------------
  fax.providerFaxId = result.providerFaxId || result.id || null;
  fax.status = "sent";
  fax.provider = provider;
  fax.region = region;

  await fax.save();

  // ----------------------------------------
  // 6. Update idempotency record
  // ----------------------------------------
  await idempotencyService.updateStatus(faxId, "sent");

  // ----------------------------------------
  // 7. Audit log
  // ----------------------------------------
  await auditService.logEvent({
    type: "PROVIDER_FAX_SENT",
    faxId,
    provider,
    region,
    tenantId: fax.tenantId,
    providerFaxId: fax.providerFaxId
  });

  // ----------------------------------------
  // 8. Return provider result
  // ----------------------------------------
  return {
    faxId,
    provider,
    providerFaxId: fax.providerFaxId,
    region,
    status: "sent"
  };
};
