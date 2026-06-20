const Fax = require("../models/Fax");
const FaxLog = require("../models/FaxLog");
const WebhookEvent = require("../models/WebhookEvent");
const { writeResidencyLog } = require("../storage/residencyStorage");
const audit = require("../audit/auditService");

/**
 * Normalize provider from headers
 */
const detectProvider = (headers) => {
  if (headers["telnyx-signature-ed25519"]) return "telnyx";
  if (headers["x-fax-provider"]) return headers["x-fax-provider"].toLowerCase();
  if (headers["user-agent"]) return headers["user-agent"].toLowerCase();
  return "unknown";
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

exports.handleFaxWebhook = async (req, res) => {
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
      residencyZone
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

    // Attempt to match fax
    let updatedFax = null;

    if (faxId) {
      updatedFax = await Fax.findOneAndUpdate(
        { faxId },
        { status, residencyZone },
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

        audit.logEvent({
          tenantId: updatedFax.tenantId,
          type: "fax",
          action: "webhook_update_success",
          details: { faxId, status, provider },
          residencyZone
        });
      }
    }

    return res.status(200).json({
      received: true,
      faxId,
      status,
      updated: Boolean(updatedFax),
      residencyZone
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    const residencyZone = req.residencyZone || "global";

    await writeResidencyLog(
      residencyZone,
      "webhook-errors.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error.message,
        residencyZone
      })
    );

    return res.status(500).json({
      error: "Failed to process webhook",
      details: error.message,
      residencyZone
    });
  }
};
