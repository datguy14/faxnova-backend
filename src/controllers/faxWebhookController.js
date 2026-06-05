import Fax from "../models/Fax.js";
import FaxLog from "../models/FaxLog.js";
import WebhookEvent from "../models/WebhookEvent.js";

export const handleFaxWebhook = async (req, res) => {
  try {
    // Provider header (you can customize this depending on Sinch/Telnyx)
    const provider =
      req.headers["x-fax-provider"]?.toLowerCase() ||
      req.headers["user-agent"]?.toLowerCase() ||
      "unknown";

    const payload = req.body;

    // Extract faxId + status safely (Sinch vs Telnyx)
    const faxId =
      payload.faxId ||
      payload.id ||
      payload.data?.id ||
      payload.data?.payload?.fax_id ||
      null;

    const status =
      payload.status ||
      payload.data?.status ||
      payload.data?.payload?.status ||
      null;

    // Always store raw webhook event
    await WebhookEvent.create({
      provider,
      payload,
      faxId,
      status,
    });

    // If we can match a fax, update it
    if (faxId) {
      await Fax.findOneAndUpdate(
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
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({
      error: "Failed to process webhook",
      details: error.message,
    });
  }
};
