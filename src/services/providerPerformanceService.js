// src/services/providerPerformanceService.js — Fully Updated, Production‑Ready (CommonJS Only)

/**
 * Provider performance scoring engine.
 *
 * Inputs:
 * - logs: recent provider logs (latency, errors)
 * - billing: usage/billing metadata (optional)
 * - health: outage status from providerOutageService
 * - region: residency-aware routing region
 *
 * Output:
 * - performanceScore (0–100)
 *
 * This score feeds directly into:
 * - providerRouter.v2
 * - routingService.v2
 * - retryFaxService
 * - DLQ routing
 */

exports.calculateProviderPerformance = async ({ logs, billing, health, region }) => {
  // ----------------------------------------
  // 1. Base score (your original logic)
  // ----------------------------------------
  let performanceScore = 50;

  // ----------------------------------------
  // 2. Health impact (your original logic)
  // ----------------------------------------
  if (health.status === "DOWN") performanceScore -= 40;
  if (health.status === "DEGRADED") performanceScore -= 10;

  // ----------------------------------------
  // 3. Region weighting (your original logic)
  // ----------------------------------------
  if (region === "us") performanceScore += 5;
  if (region === "eu") performanceScore += 3;

  // ----------------------------------------
  // 4. Latency scoring (NEW)
  // ----------------------------------------
  const recentLatency = logs?.latencyMs || null;

  if (recentLatency) {
    if (recentLatency > 3000) performanceScore -= 15;  // very slow
    else if (recentLatency > 1500) performanceScore -= 8; // slow
    else if (recentLatency < 800) performanceScore += 5;  // fast
  }

  // ----------------------------------------
  // 5. Error-rate scoring (NEW)
  // ----------------------------------------
  const errorRate = logs?.errorRate || null;

  if (errorRate) {
    if (errorRate > 0.20) performanceScore -= 20; // catastrophic
    else if (errorRate > 0.10) performanceScore -= 10; // degraded
    else if (errorRate < 0.02) performanceScore += 5; // excellent
  }

  // ----------------------------------------
  // 6. SLA scoring (NEW)
  // ----------------------------------------
  const sla = billing?.sla || null;

  if (sla) {
    if (sla < 0.90) performanceScore -= 10; // SLA breach
    else if (sla > 0.99) performanceScore += 5; // excellent SLA
  }

  // ----------------------------------------
  // 7. Provider-specific tuning (NEW)
  // ----------------------------------------
  const provider = logs?.provider || null;

  if (provider === "telnyx") {
    performanceScore += 2; // historically lower latency
  }

  if (provider === "sinch") {
    performanceScore += 1; // historically higher deliverability
  }

  // ----------------------------------------
  // 8. Clamp score (your original logic)
  // ----------------------------------------
  if (performanceScore < 0) performanceScore = 0;
  if (performanceScore > 100) performanceScore = 100;

  return { performanceScore };
};
