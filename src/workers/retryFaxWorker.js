/**
 * src/workers/retryFaxWorker.js
 *
 * Retry worker for failed faxes with outage-aware gating.
 * - Validates fax exists
 * - Gates retries during provider full outages
 * - Implements exponential backoff (2^attempts, capped at 60s)
 * - Skips if backoff window not elapsed
 * - Delegates to sendFaxService via unified provider stack
 */

const OutboundFax = require("../models/OutboundFax");
const { sendFax } = require("../services/sendFaxService");
const providerOutageService = require("../services/providerOutageService");
const FaxNovaError = require("../errors/FaxNovaError");

// Constants for exponential backoff
const MAX_BACKOFF_MS = 60_000; // 60 seconds
const BACKOFF_BASE = 2; // 2^attempts * 1000ms

/**
 * Calculate exponential backoff delay
 *
 * @param {number} attempts - Number of previous attempts
 * @returns {number} - Delay in milliseconds (capped at MAX_BACKOFF_MS)
 */
function calculateBackoffDelay(attempts) {
  const exponential = Math.pow(BACKOFF_BASE, attempts) * 1000;
  return Math.min(MAX_BACKOFF_MS, exponential);
}

/**
 * Process retry fax job with outage-aware gating
 *
 * @param {object} job - Bull queue job
 * @param {string} job.data.faxId - Unique fax identifier
 * @returns {Promise<object>} - Provider send result or undefined if skipped
 * @throws {Error} - Propagates to queue for retry/failure handling
 */
async function processRetryFax(job) {
  const { faxId } = job.data;

  // Validate input
  if (!faxId) {
    throw new FaxNovaError("faxId is required", {
      code: "INVALID_JOB_DATA"
    });
  }

  try {
    // Validate fax still exists
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      console.warn(`[retryFaxWorker] Fax not found: ${faxId}`);
      return; // Silently skip if fax was deleted
    }

    // Gate: Check if provider is in full outage
    if (fax.provider) {
      const outageState = await providerOutageService.getOutageState(fax.provider);
      if (outageState === "open") {
        console.info(
          `[retryFaxWorker] Provider ${fax.provider} in full outage, skipping retry for ${faxId}`
        );
        return; // Skip retry during full outage
      }
    }

    // Calculate backoff delay based on attempt count
    const attempts = fax.attempts || 0;
    const delayMs = calculateBackoffDelay(attempts);

    // Check if backoff window has elapsed
    const now = Date.now();
    const lastAttemptTime = fax.lastAttemptAt ? fax.lastAttemptAt.getTime() : 0;
    const nextAllowedTime = lastAttemptTime + delayMs;

    if (now < nextAllowedTime) {
      const remainingMs = nextAllowedTime - now;
      console.info(
        `[retryFaxWorker] Backoff not elapsed for ${faxId}: ${remainingMs}ms remaining`
      );
      return; // Not ready yet - queue will retry this job later
    }

    // Increment attempt counter and record timestamp
    await OutboundFax.updateOne(
      { faxId },
      {
        $inc: { attempts: 1 },
        $set: { lastAttemptAt: new Date() }
      }
    );

    // Send through unified provider stack
    const result = await sendFax(faxId);

    return result;

  } catch (err) {
    console.error(`[retryFaxWorker] Error processing retry for ${faxId}:`, err);
    // Re-throw to let queue handle the error
    throw err;
  }
}

module.exports = processRetryFax;
