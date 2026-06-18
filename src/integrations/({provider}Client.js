// src/integrations/{provider}Client.js

/**
 * Provider Client Template for FaxNova v1
 * ---------------------------------------
 * Every provider client MUST implement:
 * 
 *  - sendFax({ faxId, toNumber, fromNumber, mediaUrl })
 *  - parseWebhook(event)
 * 
 * This keeps FaxNova provider‑agnostic and plug‑and‑play.
 */

export default {
  /**
   * Send fax through provider.
   * Must return:
   *  {
   *    jobId: string,
   *    raw: providerResponse
   *  }
   */
  async sendFax({ faxId, toNumber, fromNumber, mediaUrl }) {
    // TODO: Replace with provider API call
    // Example:
    // const response = await axios.post("https://provider.com/fax/send", {...});

    return {
      jobId: `mock-${faxId}`,
      raw: {
        message: "Provider sendFax() not implemented"
      }
    };
  },

  /**
   * Normalize provider webhook payload.
   * Must return:
   *  {
   *    faxId: string,
   *    status: "queued" | "sending" | "delivered" | "failed",
   *    errorCode?: string,
   *    errorMessage?: string
   *  }
   */
  parseWebhook(event) {
    // TODO: Map provider-specific fields to FaxNova format

    return {
      faxId: event.faxId || event.id,
      status: "sending",
      errorCode: null,
      errorMessage: null
    };
  }
};
