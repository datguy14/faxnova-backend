// src/providers/sinchAdapter.js — Fully Updated, Production‑Ready (CommonJS Only)

const axios = require("axios");

/**
 * Sinch Fax Adapter
 *
 * Responsibilities:
 * - Shape Sinch payload correctly
 * - Inject callback URL for webhook correlation
 * - Normalize Sinch responses
 * - Normalize Sinch errors
 * - Provide retry‑safe exceptions for BullMQ
 */
exports.sendFax = async payload => {
  try {
    const { to, documentUrl, region, reference } = payload;

    // ----------------------------------------
    // 1. Build Sinch API request
    // ----------------------------------------
    const response = await axios.post(
      "https://api.sinch.com/fax/v1/send",
      {
        to,
        documentUrl, // must be full URL, not storageKey
        region: region || "us",
        callbackUrl: process.env.SINCH_WEBHOOK_URL,
        reference // faxId for webhook correlation
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000 // prevent hanging requests
      }
    );

    // ----------------------------------------
    // 2. Normalize Sinch response
    // ----------------------------------------
    const providerFaxId = response?.data?.id || response?.data?.faxId || null;

    return {
      provider: "sinch",
      providerFaxId,
      raw: response.data
    };

  } catch (err) {
    // ----------------------------------------
    // 3. Normalize Sinch errors
    // ----------------------------------------
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Sinch fax send error";

    // Throw normalized error so BullMQ can retry safely
    throw new Error(message);
  }
};
