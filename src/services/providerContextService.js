// src/services/providerContextService.js

const { getProviderRoutingRules } = require('./providerRoutingRules');

// ===== Provider Error Maps =====
const SINCH_ERROR_MAP = {
  4862: "Line busy",
  4800: "Fax number unreachable",
  4001: "Document conversion failed",
};

const TELNYX_ERROR_MAP = {
  30001: "Carrier rejected the fax",
  30002: "No answer",
  30003: "Fax negotiation failed",
};

// ===== Provider Log Fetchers =====
// (You can replace these with real API calls later)
async function getSinchLogs(faxId) {
  return [
    { event: "queued", timestamp: Date.now() - 5000 },
    { event: "sent", timestamp: Date.now() - 3000 },
  ];
}

async function getTelnyxLogs(faxId) {
  return [
    { event: "accepted", timestamp: Date.now() - 4000 },
    { event: "delivered", timestamp: Date.now() - 2000 },
  ];
}


// ===== Main Provider Context Builder =====
module.exports.getProviderContext = async function getProviderContext(provider, faxId) {
  const routingRules = getProviderRoutingRules(provider);

  const base = {
    provider,
    hipaa: routingRules.hipaa,
    encryption: true,
    routingRules,
  };

  if (provider === 'sinch') {
    return {
      ...base,
      logs: faxId ? await getSinchLogs(faxId) : [],
      errorMap: SINCH_ERROR_MAP,
      retryPolicy: routingRules.maxRetries,
      region: routingRules.preferredRegions[0] || 'us-east',
    };
  }

  if (provider === 'telnyx') {
    return {
      ...base,
      logs: faxId ? await getTelnyxLogs(faxId) : [],
      errorMap: TELNYX_ERROR_MAP,
      retryPolicy: routingRules.maxRetries,
      region: routingRules.preferredRegions[0] || 'us-central',
    };
  }

  // Default provider fallback
  return {
    ...base,
    logs: [],
    errorMap: {},
    retryPolicy: 1,
    region: 'unknown',
  };
};
