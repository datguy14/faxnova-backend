// src/services/webhookService.js

const OutboundFax = require("../models/OutboundFax");
const InboundFax = require("../models/InboundFax");
const telnyxInbound = require("../providers/telnyxInboundAdapter");
const sinchInbound = require("../providers/sinchInboundAdapter");

exports.processWebhook = async payload => {
  let normalized;

  if (payload.provider === "telnyx") {
    normalized = telnyxInbound.normalizeInbound(payload);
  } else if (payload.provider === "sinch") {
    normalized = sinchInbound.normalizeInbound(payload);
  } else {
    throw new Error("Unknown provider webhook");
  }

  // Update outbound fax if providerFaxId matches
  await OutboundFax.updateOne(
    { providerFaxId: normalized.providerFaxId },
    { status: normalized.status }
  );

  // Store inbound fax
  await InboundFax.create(normalized);
};
