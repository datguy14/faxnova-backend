// src/services/FaxEventService.js

const FaxEvent = require("../models/FaxEvent");
const FaxError = require("../errors/FaxError");

/**
 * FaxEventService — Strict‑Mode Edition
 *
 * Handles persistence of inbound and outbound fax events.
 * No routing engine, no diagnostics, no provider scoring.
 */

class FaxEventService {
  /**
   * Records an outbound fax event.
   */
  static async recordOutbound({
    provider,
    providerFaxId,
    to,
    storageKey,
    region
  }) {
    try {
      await FaxEvent.create({
        direction: "outbound",
        provider,
        providerFaxId,
        to,
        storageKey,
        region,
        createdAt: new Date()
      });
    } catch (err) {
      throw new FaxError(`Failed to record outbound fax event: ${err.message}`);
    }
  }

  /**
   * Records an inbound fax event.
   */
  static async recordInbound({
    provider,
    providerFaxId,
    from,
    storageKey,
    region,
    status
  }) {
    try {
      await FaxEvent.create({
        direction: "inbound",
        provider,
        providerFaxId,
        from,
        storageKey,
        region,
        status,
        createdAt: new Date()
      });
    } catch (err) {
      throw new FaxError(`Failed to record inbound fax event: ${err.message}`);
    }
  }
}

module.exports = FaxEventService;
