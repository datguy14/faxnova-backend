// src/providers/providerApiService.js — Unified Fax Architecture (CommonJS Only)

const axios = require("axios");
const auditService = require("../services/auditService");

/**
 * Unified Provider API Service
 *
 * Responsibilities:
 * - Route outbound fax sends to Telnyx or Sinch
 * - Embed FaxNova metadata (faxId, tenantId, region)
 * - Normalize provider responses
 * - Provide a consistent providerFaxId for webhook correlation
 */

module.exports = {
  /**
   * Send fax through the selected provider.
   */
  async sendFax({ provider, to, from, storageKey, faxId, region }) {
    if (!provider) {
      throw new Error("Provider is required for outbound fax");
    }

    if (provider === "telnyx") {
      return await sendViaTelnyx({ to, from, storageKey, faxId, region });
    }

    if (provider === "sinch") {
      return await sendViaSinch({ to, from, storageKey, faxId, region });
    }

    throw new Error(`Unknown provider: ${provider}`);
  }
};

/**
 * Telnyx Outbound Send
 */
async function sendViaTelnyx({ to, from, storageKey, faxId, region }) {
  try {
    const response = await axios.post(
      `${process.env.TELNYX_API_URL}/v2/faxes`,
      {
        to,
        from,
        media_url: `${process.env.STORAGE_API_URL}/file/${storageKey}`,
        metadata: {
          faxId,
          region
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
        }
      }
    );

    const providerFaxId = response.data?.data?.id;

    await auditService.logEvent({
      type: "OUTBOUND_PROVIDER_SEND",
      action: "telnyx_send",
      faxId,
      provider: "telnyx",
      providerStatus: "queued",
      region,
      details: { providerFaxId }
    });

    return { providerFaxId };
  } catch (err) {
    await auditService.logEvent({
      type: "OUTBOUND_PROVIDER_ERROR",
      action: "telnyx_send_failed",
      faxId,
      provider: "telnyx",
      region,
      details: { error: err.message }
    });

    throw new Error(`Telnyx send error: ${err.message}`);
  }
}

/**
 * Sinch Outbound Send
 */
async function sendViaSinch({ to, from, storageKey, faxId, region }) {
  try {
    const response = await axios.post(
      `${process.env.SINCH_API_URL}/v1/faxes`,
      {
        to,
        from,
        document_url: `${process.env.STORAGE_API_URL}/file/${storageKey}`,
        reference: faxId,
        region
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`
        }
      }
    );

    const providerFaxId =
      response.data?.id ||
      response.data?.faxId ||
      response.data?.reference;

    await auditService.logEvent({
      type: "OUTBOUND_PROVIDER_SEND",
      action: "sinch_send",
      faxId,
      provider: "sinch",
      providerStatus: "queued",
      region,
      details: { providerFaxId }
    });

    return { providerFaxId };
  } catch (err) {
    await auditService.logEvent({
      type: "OUTBOUND_PROVIDER_ERROR",
      action: "sinch_send_failed",
      faxId,
      provider: "sinch",
      region,
      details: { error: err.message }
    });

    throw new Error(`Sinch send error: ${err.message}`);
  }
}
