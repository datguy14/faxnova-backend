// src/services/providerApiService.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

// Provider configs (replace with your env vars)
const SINCH_API_URL = process.env.SINCH_FAX_API_URL;
const SINCH_API_KEY = process.env.SINCH_FAX_API_KEY;

const TELNYX_API_URL = process.env.TELNYX_FAX_API_URL;
const TELNYX_API_KEY = process.env.TELNYX_FAX_API_KEY;

// ---------------------------------------------------------
// Core provider API dispatcher
// ---------------------------------------------------------
async function sendToProvider(fax, provider) {
  switch (provider) {
    case "sinch":
      return sendViaSinch(fax);

    case "telnyx":
      return sendViaTelnyx(fax);

    default:
      throw new FaxNovaError(`Unknown provider: ${provider}`, 500);
  }
}

// ---------------------------------------------------------
// Sinch Fax API Integration
// ---------------------------------------------------------
async function sendViaSinch(fax) {
  try {
    const payload = {
      to: fax.to,
      from: fax.from,
      mediaUrl: fax.mediaUrl,
      callbackUrl: fax.callbackUrl,
      metadata: { faxId: fax._id },
    };

    const response = await axios.post(`${SINCH_API_URL}/faxes`, payload, {
      headers: {
        Authorization: `Bearer ${SINCH_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return {
      provider: "sinch",
      status: "sent",
      providerFaxId: response.data.id,
      raw: response.data,
    };

  } catch (err) {
    throw new FaxNovaError(
      `Sinch fax send failed: ${err.message}`,
      err.response?.status || 500
    );
  }
}

// ---------------------------------------------------------
// Telnyx Fax API Integration
// ---------------------------------------------------------
async function sendViaTelnyx(fax) {
  try {
    const payload = {
      to: fax.to,
      from: fax.from,
      media_url: fax.mediaUrl,
      webhook_url: fax.callbackUrl,
      metadata: { faxId: fax._id },
    };

    const response = await axios.post(`${TELNYX_API_URL}/faxes`, payload, {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return {
      provider: "telnyx",
      status: "sent",
      providerFaxId: response.data.data.id,
      raw: response.data,
    };

  } catch (err) {
    throw new FaxNovaError(
      `Telnyx fax send failed: ${err.message}`,
      err.response?.status || 500
    );
  }
}

module.exports = sendToProvider;
