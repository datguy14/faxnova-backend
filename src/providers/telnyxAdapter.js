// src/providers/telnyxAdapter.js — Fully Updated, Production‑Ready (CommonJS Only)

const axios = require("axios");

/**
 * Telnyx Fax Adapter
 *
 * Responsibilities:
 * - Shape Telnyx payload correctly
 * - Inject metadata for webhook correlation
 * - Normalize Telnyx responses
 * - Normalize Telnyx errors
 * - Provide retry‑safe exceptions for BullMQ
 */
exports.sendFax = async payload => {
  try {
    const { to, media_url, region, metadata } = payload;

    // ----------------------------------------
    // 1. Build Telnyx API request
    // ----------------------------------------
    const response = await axios.post(
      "https://api.telnyx.com/v2/faxes",
      {
        to,
        media_url,
        connection_id: process.env.TELNYX_CONNECTION_ID,
        // Metadata is critical for webhook correlation
        metadata: metadata || {},
        // Region routing (Telnyx supports region hints)
        region: region || "us"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000 // prevent hanging requests
      }
    );

    // ----------------------------------------
    // 2. Normalize Telnyx response
    // ----------------------------------------
    const providerFaxId = response?.data?.data?.id || null;

    return {
      provider: "telnyx",
      providerFaxId,
      raw: response.data
    };

  } catch (err) {
    // ----------------------------------------
    // 3. Normalize Telnyx errors
    // ----------------------------------------
    const message =
      err?.response?.data?.errors?.[0]?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Telnyx fax send error";

    // Throw normalized error so BullMQ can retry safely
    throw new Error(message);
  }
};
