import Fax from "../models/Fax.js";
import FaxLog from "../models/FaxLog.js";
import WebhookEvent from "../models/WebhookEvent.js";
import { writeResidencyLog } from "../storage/residencyStorage.js";

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
 * Main webhook handler - now residency-aware
 */
export const handleFaxWebhook = async (req, res) => {
  try {
    const provider = detectProvider(req.headers);
    const payload = req.body;
    const residencyZone = req.residencyZone || "global";

    const faxId = extractFaxId(payload);
    const status = extractStatus(payload);

    // Always store raw webhook event
    const webhookEvent = await WebhookEvent.create({
      provider,
      payload,
      faxId,
      status,
      residencyZone // Store zone for later reference
    });

    // Log webhook to residency storage
    await writeResidencyLog(
      residencyZone,
      "webhook-events.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        provider,
        faxId,
        status,
        webhookEventId: webhookEvent._id,
        residencyZone
      })
    );

    // If we can match a fax, update it
    if (faxId) {
      const updatedFax = await Fax.findOneAndUpdate(
        { faxId },
        { 
          status,
          residencyZone // Ensure zone is stored
        },
        { new: true }
      );

      if (updatedFax) {
        await FaxLog.create({
          faxId: updatedFax._id,
          provider,
          action: "webhook_received",
          message: `Webhook received with status: ${status}`,
          metadata: {
            residencyZone,
            webhookEventId: webhookEvent._id
          }
        });

        // Log to residency storage
        await writeResidencyLog(
          residencyZone,
          "webhook-updates.log",
          JSON.stringify({
            timestamp: new Date().toISOString(),
            faxId: updatedFax._id,
            externalFaxId: faxId,
            provider,
            status,
            residencyZone
          })
        );
      }

      return res.status(200).json({
        received: true,
        faxId,
        status,
        updated: Boolean(updatedFax),
        residencyZone
      });
    }

    // If no faxId found, still acknowledge webhook
    return res.status(200).json({
      received: true,
      faxId: null,
      status,
      warning: "Webhook received but no faxId was detected",
      residencyZone
    });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    const residencyZone = req.residencyZone || "global";

    // Log error to residency storage
    try {
      await writeResidencyLog(
        residencyZone,
        "webhook-errors.log",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          residencyZone
        })
      );
    } catch (logError) {
      console.error("Failed to log error to residency storage:", logError);
    }

    return res.status(500).json({
      error: "Failed to process webhook",
      details: error.message,
      residencyZone
    });
  }
};
