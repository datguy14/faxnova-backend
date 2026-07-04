// src/services/faxStorageService.js — STRICT-MODE FINAL

const InboundFax = require("../models/InboundFax");
const OutboundFax = require("../models/OutboundFax");
const { v4: uuid } = require("uuid");
const s3 = require("../lib/s3"); // your S3 wrapper
const path = require("path");
const fs = require("fs");

module.exports = {
  /**
   * Store inbound fax metadata + media
   */
  async storeInbound(payload) {
    const faxId = uuid();

    // Store media in S3 (or local fallback)
    const mediaKey = await this._storeMedia(payload.mediaBuffer, faxId, "inbound");

    // Save metadata
    const doc = await InboundFax.create({
      faxId,
      provider: payload.provider,
      from: payload.from,
      to: payload.to,
      residencyZone: payload.residencyZone,
      sovereignty: payload.sovereignty,
      region: payload.region,
      mediaKey,
      status: "stored",
      providerMessageId: payload.providerMessageId || null,
      providerStatus: payload.providerStatus || null
    });

    return doc;
  },

  /**
   * Store outbound fax metadata + media
   */
  async storeOutbound(payload) {
    const faxId = uuid();

    // Store media in S3 (or local fallback)
    const mediaKey = await this._storeMedia(payload.mediaBuffer, faxId, "outbound");

    // Save metadata
    const doc = await OutboundFax.create({
      faxId,
      from: payload.from,
      to: payload.to,
      provider: payload.provider,
      residencyZone: payload.residencyZone,
      sovereignty: payload.sovereignty,
      region: payload.region,
      mediaKey,
      status: "queued"
    });

    return doc;
  },

  /**
   * Retrieve fax metadata (inbound or outbound)
   */
  async getFax(faxId) {
    const inbound = await InboundFax.findOne({ faxId });
    if (inbound) return inbound;

    const outbound = await OutboundFax.findOne({ faxId });
    return outbound || null;
  },

  /**
   * Delete fax metadata + media
   */
  async deleteFax(faxId) {
    const inbound = await InboundFax.findOne({ faxId });
    const outbound = await OutboundFax.findOne({ faxId });

    const doc = inbound || outbound;
    if (!doc) return false;

    // Delete media from S3/local
    await this._deleteMedia(doc.mediaKey);

    // Delete metadata
    if (inbound) await InboundFax.deleteOne({ faxId });
    if (outbound) await OutboundFax.deleteOne({ faxId });

    return true;
  },

  /**
   * INTERNAL: Store media in S3 or local filesystem
   */
  async _storeMedia(buffer, faxId, direction) {
    const key = `faxnova/${direction}/${faxId}.pdf`;

    if (s3.enabled) {
      await s3.putObject({
        Key: key,
        Body: buffer,
        ContentType: "application/pdf"
      });
      return key;
    }

    // Local fallback
    const filePath = path.join(__dirname, "..", "..", "storage", key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return key;
  },

  /**
   * INTERNAL: Delete media from S3 or local filesystem
   */
  async _deleteMedia(key) {
    if (s3.enabled) {
      await s3.deleteObject({ Key: key });
      return;
    }

    const filePath = path.join(__dirname, "..", "..", "storage", key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}; 
