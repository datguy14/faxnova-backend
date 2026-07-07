// src/services/providerApiService.js — Fully Updated, Production‑Ready (CommonJS Only)

const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

/**
 * Unified provider API execution layer.
 *
 * Responsibilities:
 * - Normalize provider responses
 * - Normalize provider errors
 * - Provide retry‑safe exceptions for BullMQ
 * - Shape providerFaxId consistently
 * - Enforce provider‑specific payload rules
 * - Provide consistent return format for workers
 */
exports.sendFax = async (provider, payload) => {
  try {
    let raw;

    // ----------------------------------------
    // 1. Provider dispatch
    // ----------------------------------------
    switch (provider) {
      case "telnyx":
        raw = await telnyxAdapter.sendFax(payload);
        break;

      case "sinch":
        raw = await sinchAdapter.sendFax(payload);
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // ----------------------------------------
    // 2. Normalize provider response
    // ----------------------------------------
    const normalized = normalizeProviderResponse(provider, raw);

    return normalized;

  } catch (err) {
    // ----------------------------------------
    // 3. Normalize provider error
    // ----------------------------------------
    const normalizedError = normalizeProviderError(provider, err);

    // Throw normalized error so BullMQ can retry safely
    throw new Error(normalizedError.message);
  }
};

/**
 * Normalize provider success responses.
 * Ensures consistent shape across Telnyx, Sinch, and future providers.
 */
function normalizeProviderResponse(provider, raw) {
  if (provider === "telnyx") {
    return {
      provider,
      providerFaxId: raw?.data?.id || raw?.id || null,
      raw
    };
  }

  if (provider === "sinch") {
    return {
      provider,
      providerFaxId: raw?.id || raw?.faxId || null,
      raw
    };
  }

  return {
    provider,
    providerFaxId: null,
    raw
  };
}

/**
 * Normalize provider errors.
 * Ensures workers receive retry‑safe, consistent error messages.
 */
function normalizeProviderError(provider, err) {
  const message = extractProviderErrorMessage(provider, err);

  return {
    provider,
    message,
    raw: err
  };
}

/**
 * Extract readable error messages from provider responses.
 */
function extractProviderErrorMessage(provider, err) {
  if (!err) return "Unknown provider error";

  // Telnyx error format
  if (provider === "telnyx") {
    return (
      err?.response?.data?.errors?.[0]?.detail ||
      err?.response?.data?.message ||
      err.message ||
      "Telnyx error"
    );
  }

  // Sinch error format
  if (provider === "sinch") {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Sinch error"
    );
  }

  return err.message || "Provider error";
}
