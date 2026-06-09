/**
 * Residency-Aware Provider Router
 * Routes fax delivery through providers allowed in the request's residency zone
 * Handles fallback between providers while respecting zone constraints
 */

import * as sinch from "../integrations/sinchProvider.js";
import * as telnyx from "../integrations/telnyxProvider.js";
import { isProviderAllowed, getProvidersForZone } from "../residency/policy.js";

/**
 * Route a fax through residency-compliant providers
 * @param {object} payload - Fax payload (to, from, document, etc.)
 * @param {string} zone - Residency zone identifier
 * @returns {object} - Fax result with routing metadata
 */
export async function routeFax(payload, zone = "global") {
  const allowedProviders = getProvidersForZone(zone);
  
  if (allowedProviders.length === 0) {
    throw new Error(`No providers configured for residency zone: ${zone}`);
  }
  
  // Route through primary provider if allowed
  const primaryProvider = payload.preferredProvider || "sinch";
  
  if (isProviderAllowed(zone, primaryProvider)) {
    try {
      if (primaryProvider === "sinch") {
        const result = await sinch.sendFax(payload);
        return {
          ...result,
          primaryProvider: "sinch",
          residencyZone: zone,
          failoverUsed: false
        };
      } else if (primaryProvider === "telnyx") {
        const result = await telnyx.sendFax(payload);
        return {
          ...result,
          primaryProvider: "telnyx",
          residencyZone: zone,
          failoverUsed: false
        };
      }
    } catch (error) {
      console.warn(
        `[Provider Router] ${primaryProvider} failed for zone ${zone}, attempting fallback:`,
        error.message
      );
      // Fall through to fallback logic
    }
  } else {
    console.log(
      `[Provider Router] ${primaryProvider} not allowed in zone ${zone}, using fallback`
    );
  }
  
  // Fallback: try remaining allowed providers
  for (const provider of allowedProviders) {
    if (provider === primaryProvider) continue; // Skip primary, already tried
    
    try {
      console.log(
        `[Provider Router] Attempting fallback to ${provider} for zone ${zone}`
      );
      
      if (provider === "sinch") {
        const result = await sinch.sendFax(payload);
        return {
          ...result,
          primaryProvider: primaryProvider,
          fallbackProvider: "sinch",
          residencyZone: zone,
          failoverUsed: true
        };
      } else if (provider === "telnyx") {
        const result = await telnyx.sendFax(payload);
        return {
          ...result,
          primaryProvider: primaryProvider,
          fallbackProvider: "telnyx",
          residencyZone: zone,
          failoverUsed: true
        };
      }
    } catch (error) {
      console.error(
        `[Provider Router] Fallback to ${provider} failed:`,
        error.message
      );
      continue;
    }
  }
  
  // All providers exhausted
  throw new Error(
    `All providers failed for zone ${zone}. Allowed providers: ${allowedProviders.join(", ")}`
  );
}

/**
 * Check if a provider is available for a zone
 * @param {string} zone - Residency zone identifier
 * @param {string} provider - Provider name
 * @returns {boolean} - True if provider is allowed and available
 */
export function isProviderAvailable(zone, provider) {
  return isProviderAllowed(zone, provider);
}

/**
 * Get provider status for a zone (for health checks, etc.)
 * @param {string} zone - Residency zone identifier
 * @returns {object} - Provider availability status
 */
export function getProviderStatus(zone = "global") {
  const providers = getProvidersForZone(zone);
  return {
    zone,
    availableProviders: providers,
    providerCount: providers.length
  };
}
