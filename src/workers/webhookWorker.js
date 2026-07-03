/**
 * src/workers/webhookWorker.js
 *
 * Worker for processing batched webhook events from providers.
 * - Validates idempotency (externalEventId unique)
 * - Records all webhook events
 * - Applies provider performance/outage feedback
 * - Batch updates fax statuses for efficiency
 * - Evaluates provider health after events processed
 */

const WebhookEvent = require("../models/WebhookEvent");
const OutboundFax = require("../models/OutboundFax");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerHealthService = require("../services/providerHealthService");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Apply provider feedback based on webhook status
 *
 * @param {string} provider - Provider name
 * @param {string} status - Webhook status (delivered | failed | etc)
 */
async function applyProviderFeedback(provider, status) {
  if (status === "delivered") {
    await Promise.all([
      providerPerformanceService.applySuccessBoost(provider),
      providerOutageService.recordSuccess(provider)
    ]);
  } else if (status === "failed") {
    await Promise.all([
      providerPerformanceService.applyFailurePenalty(provider),
      providerOutageService.recordFailure(provider)
    ]);
  }

  // Evaluate health after feedback
  await providerHealthService.evaluate(provider);
}

/**
 * Process batch of webhook events
 *
 * @param {object} job - Bull queue job
 * @param {array} job.data.events - Array of webhook payloads
 * @returns {Promise<object>} - Processing summary
 * @throws {FaxNovaError} - If batch processing fails
 */
async function processWebhookBatch(job) {
  const events = job.data.events;

  // Validate input
  if (!Array.isArray(events) || events.length === 0) {
    throw new FaxNovaError("No events to process", {
      code: "INVALID_WEBHOOK_BATCH"
    });
  }

  const webhookDocs = [];
  const faxUpdates = [];
  const processedProviders = new Set();

  try {
    for (const evt of events) {
      const { externalEventId, provider, faxId, status, raw } = evt;

      // Validate event has required fields
      if (!externalEventId || !provider || !faxId || !status) {
        console.warn("[webhookWorker] Skipping malformed event:", evt);
        continue;
      }

      // Idempotency check: skip if event already processed
      const exists = await WebhookEvent.findOne({ externalEventId });
      if (exists) {
        console.info(
          `[webhookWorker] Event already processed: ${externalEventId}`
        );
        continue;
      }

      // Build webhook document
      webhookDocs.push({
        externalEventId,
        provider,
        faxId,
        status,
        providerStatus: evt.providerStatus || null,
        errorCode: evt.errorCode || null,
        errorMessage: evt.errorMessage || null,
        raw,
        processedAt: new Date(),
        createdAt: new Date()
      });

      // Apply provider feedback
      await applyProviderFeedback(provider, status);
      processedProviders.add(provider);

      // Build fax status update
      faxUpdates.push({
        updateOne: {
          filter: { faxId },
          update: {
            $set: {
              status,
              errorCode: evt.errorCode || null,
              errorMessage: evt.errorMessage || null
            }
          }
        }
      });
    }

    // Batch insert webhook events (idempotency enforced by unique index)
    if (webhookDocs.length > 0) {
      try {
        await WebhookEvent.insertMany(webhookDocs);
      } catch (insertErr) {
        if (insertErr.code === 11000) {
          // Duplicate key error - some events were duplicates
          console.warn(
            "[webhookWorker] Some events were duplicates, continuing with unique events"
          );
        } else {
          throw insertErr;
        }
      }
    }

    // Batch update fax statuses
    if (faxUpdates.length > 0) {
      await OutboundFax.bulkWrite(faxUpdates);
    }

    const result = {
      processed: webhookDocs.length,
      updated: faxUpdates.length,
      providersAffected: Array.from(processedProviders)
    };

    console.info("[webhookWorker] Batch processing complete:", result);

    return result;

  } catch (err) {
    console.error("[webhookWorker] Error processing webhook batch:", err);
    throw new FaxNovaError("Failed to process webhook batch", {
      code: "WEBHOOK_BATCH_FAILED",
      details: {
        eventCount: events.length,
        error: err.message
      }
    });
  }
}

module.exports = processWebhookBatch;
