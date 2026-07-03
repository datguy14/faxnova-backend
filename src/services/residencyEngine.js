// src/services/residencyEngine.js — STRICT-MODE VERSION

module.exports = {
  /**
   * Resolve residency + sovereignty + routing region for inbound faxes
   */
  resolveInboundResidency({ from }) {
    const normalized = normalizeNumber(from);

    // Residency zone (data residency)
    const residencyZone = determineResidencyZone(normalized);

    // Sovereignty (legal jurisdiction)
    const sovereignty = determineSovereignty(normalized);

    // Routing region (provider routing)
    const region = residencyZone || sovereignty || "us";

    return {
      residencyZone,
      sovereignty,
      region
    };
  },

  /**
   * Resolve residency for outbound faxes
   */
  resolveOutboundResidency({ to }) {
    const normalized = normalizeNumber(to);

    const residencyZone = determineResidencyZone(normalized);
    const sovereignty = determineSovereignty(normalized);
    const region = residencyZone || sovereignty || "us";

    return {
      residencyZone,
      sovereignty,
      region
    };
  }
};

/**
 * Normalize phone numbers
 */
function normalizeNumber(num) {
  if (!num) return "";
  return num.replace(/\D/g, "");
}

/**
 * Residency zone rules
 * US numbers → us
 * EU numbers → eu
 * Everything else → us (default)
 */
function determineResidencyZone(number) {
  if (number.startsWith("1")) return "us"; // NANP
  if (number.startsWith("3") || number.startsWith("4")) return "eu"; // EU country codes
  return "us";
}

/**
 * Sovereignty rules
 * US numbers → us
 * EU numbers → eu
 * Everything else → us (default)
 */
function determineSovereignty(number) {
  if (number.startsWith("1")) return "us";
  if (number.startsWith("3") || number.startsWith("4")) return "eu";
  return "us";
}
