// src/services/providerContextService.js

const { getProviderRoutingRules } = require('./providerRoutingRules');
const { updateProviderHealth, getProviderHealth } = require('./providerOutageService');
const { getProviderBillingRates } = require('./providerBillingService');

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
// Replace with real API calls later
async function getSinchLogs(faxId) {
  return [
    { event: "queued", timestamp: Date.now() - 5000 },
    { event: "sent", timestamp: Date.now() - 3000 },
    { event: "delivered", timestamp: Date.now() - 1000, latency: 2000 },
  ];
}

async function getTelnyxLogs(faxId) {
  return [
    { event: "accepted", timestamp: Date.now() - 4000 },
    { event: "delivered", timestamp: Date.now() - 2000, latency: 2500 },
  ];
}


// ===== Main Provider Context Builder =====
module.exports.getProviderContext = async function getProviderContext(provider, faxId) {
  const routingRules = getProviderRoutingRules(provider);
  const billing = getProviderBillingRates(provider);

  // Base provider metadata
  const base = {
    provider,
    hipaa: routingRules.hipaa,
    encryption: true,
    routingRules,
    billing,
  };

  // Provider-specific logic
  if (provider === 'sinch') {
    const logs = faxId ? await getSinchLogs(faxId) : [];
    const health = updateProviderHealth('sinch', logs);

    return {
      ...base,
      logs,
      errorMap: SINCH_ERROR_MAP,
      retry: {
        maxRetries: routingRules.maxRetries,
        retryDelays: routingRules.retryDelays,
        immediateFailoverErrors: routingRules.immediateFailoverErrors,
        failoverTo: routingRules.failoverTo,
      },
      region: routingRules.preferredRegions[0] || 'us-east',
      health,
      failoverTo: routingRules.failoverTo,
    };
  }

  if (provider === 'telnyx') {
    const logs = faxId ? await getTelnyxLogs(faxId) : [];
    const health = updateProviderHealth('telnyx', logs);

    return {
      ...base,
      logs,
      errorMap: TELNYX_ERROR_MAP,
      retry: {
        maxRetries: routingRules.maxRetries,
        retryDelays: routingRules.retryDelays,
        immediateFailoverErrors: routingRules.immediateFailoverErrors,
        failoverTo: routingRules.failoverTo,
      },
      region: routingRules.preferredRegions[0] || 'us-central',
      health,
      failoverTo: routingRules.failoverTo,
    };
  }

  // Default fallback
  return {
    ...base,
    logs: [],
    errorMap: {},
    retry: {
      maxRetries: 1,
      retryDelays: [5000],
      immediateFailoverErrors: [],
      failoverTo: null,
    },
    region: 'unknown',
    health: getProviderHealth(provider),
    failoverTo: null,
  };
};
