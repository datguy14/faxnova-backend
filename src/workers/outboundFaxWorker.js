/**
 * src/workers/outboundFaxWorker.js
 *
 * Worker for initial outbound fax processing.
 * - Validates input data
 * - Increments attempt counter and records timestamp
 * - Delegates to sendFaxService for unified provider stack handling
 * - Propagates errors for queue retry/failure handling
 */

const OutboundFax = require("../models/OutboundFax");
const { sendFax } = require("../services/sendFaxService");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Process outbound fax job
 *
 * @param {object} job - Bull queue job
 * @param {string} job.data.faxId - Unique fax identifier
 * @returns {Promise<object>} - Provider send result
 * @throws {FaxNovaError} - Propagates to queue for retry/failure handling
 */
async function processOutboundFax(job) {
  const { faxId } = job.data;

  // Validate input
  if (!faxId) {
    throw new FaxNovaError("faxId is required", {
      code: "INVALID_JOB_DATA"
    });
  }

  try {
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
    // Re-throw with context for queue error handling
    throw new FaxNovaError("Outbound fax processing failed", {
      code: "OUTBOUND_FAX_FAILED",
      details: {
        faxId,
        originalError: err.message,
        originalCode: err.code
      }
    });
  }
}

module.exports = processOutboundFax;
