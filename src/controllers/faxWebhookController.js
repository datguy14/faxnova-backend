import Fax from "../models/Fax.js";
import FaxLog from "../models/FaxLog.js";
import WebhookEvent from "../models/WebhookEvent.js";

/**
 * Normalize provider from headers
 */
const detectProvider = (headers) => {
  const raw =
    headers["x-fax-provider"] ||
    headers["user-agent"] ||
    headers["telnyx-signature-ed25519"] ? "telnyx" : null;

  return raw?.toLowerCase() || "unknown";
};

/**
 * Extract faxId from ANY provider payload shape
 */
const extractFaxId = (payload) => {
  return (
    payload?.faxId ||
    payload?.id ||
    payload?.data?.id ||
    payload?.data?.payload?.fax_id ||
    payload?.data?.payload?.faxId ||
    null
  );
};

/**
 * Extract status from ANY provider payload shape
 */
const extractStatus = (payload) => {
  return (
    payload?.status ||
    payload?.data?.status ||
    payload?.data?.payload?.status ||
    payload?.event_type ||
    null
  );
};

/**
 * Main webhook handler
 */
export const handleFaxWebhook = async (req, res) => {
  try {
    const provider = detectProvider(req.headers);
    const payload = req.body;

    const faxId = extractFaxId(payload);
    const status = extractStatus(payload);

    // Always store raw webhook event
    await WebhookEvent.create({
      provider,
      payload,
      faxId,
      status,
    });

    // If we can match a fax, update it
    if (faxId) {
      const updatedFax = await Fax.findOneAndUpdate(
        { faxId },
        { status },
        { new: true }
      );

      await FaxLog.create({
        faxId,
        provider,
        action: "webhook_received",
        message: `Webhook received with status: ${status}`,
      });

      return res.status(200).json({
        received: true,
        faxId,
        status,
        updated: Boolean(updatedFax),
      });
    }

    // If no faxId found, still acknowledge webhook
    return res.status(200).json({
      received: true,
      faxId: null,
      status,
      warning: "Webhook received but no faxId was detected",
    });
  } catch (error) {
    console.error("❌ Webhook Error:", error);

    return res.status(500).json({
      error: "Failed to process webhook",
      details: error.message,
    });
  }
};
