// src/providers/providerRoutingRules.js

/**
 * FaxNova v1 Routing Rules (Sinch + Telnyx only)
 *
 * Routing Engine v2 uses:
 * - residencyZone (us, eu, global)
 * - tier (basic, pro, enterprise)
 *
 * Output:
 * {
 *   providers: ["sinch", "telnyx"],
 *   weights: {
 *     health: Number,
 *     outage: Number,
 *     billing: Number
 *   }
 * }
 */

const rules = {
  us: {
    basic: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.50,
        outage: 0.30,
        billing: 0.20
      }
    },
    pro: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.55,
        outage: 0.25,
        billing: 0.20
      }
    },
    enterprise: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.60,
        outage: 0.25,
        billing: 0.15
      }
    }
  },

  eu: {
    basic: {
      providers: ["telnyx", "sinch"],
      weights: {
        health: 0.45,
        outage: 0.35,
        billing: 0.20
      }
    },
    pro: {
      providers: ["telnyx", "sinch"],
      weights: {
        health: 0.50,
        outage: 0.30,
        billing: 0.20
      }
    },
    enterprise: {
      providers: ["telnyx", "sinch"],
      weights: {
        health: 0.55,
        outage: 0.30,
        billing: 0.15
      }
    }
  },

  global: {
    basic: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.40,
        outage: 0.40,
        billing: 0.20
      }
    },
    pro: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.45,
        outage: 0.35,
        billing: 0.20
      }
    },
    enterprise: {
      providers: ["sinch", "telnyx"],
      weights: {
        health: 0.50,
        outage: 0.35,
        billing: 0.15
      }
    }
  }
};

/**
 * Get routing rules for residencyZone + tier
 */
function getRules({ residencyZone, tier }) {
  const zone = rules[residencyZone];
  if (!zone) {
    throw new Error(`Invalid residency zone: ${residencyZone}`);
  }

  const tierRules = zone[tier];
  if (!tierRules) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  return tierRules;
}

module.exports = {
  getRules
};
