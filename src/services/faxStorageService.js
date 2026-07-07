// src/storage/faxStorageService.js — Unified Fax Architecture

const axios = require("axios");
const auditService = require("../services/auditService");

/**
 * Upload a fax file (PDF/TIFF) to the storage API.
 * Returns a storageKey used by providers (Telnyx/Sinch).
 *
 * Unified Fax Architecture:
 * - tenant-aware
 * - region-aware
 * - audit logged
 */
exports.storeFax = async ({ tenantId, faxId, buffer, filename, region }) => {
  try {
    const endpoint = process.env.STORAGE_API_URL;

    const response = await axios.post(`${endpoint}/upload`, buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": filename,
        "X-Region": region || "us",
        "X-Tenant": tenantId
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const storageKey = response.data.storageKey;

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "FAX_STORAGE_WRITE",
      action: "file_uploaded",
      region,
      details: { filename, storageKey }
    });

    return { storageKey };
  } catch (err) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "FAX_STORAGE_ERROR",
      action: "file_upload_failed",
      region,
      details: { filename, error: err.message }
    });

    throw new Error(`Storage API error: ${err.message}`);
  }
};

/**
 * Retrieve a fax file from storage by storageKey.
 */
exports.getFaxFile = async ({ tenantId, faxId, storageKey, region }) => {
  try {
    const endpoint = process.env.STORAGE_API_URL;

    const response = await axios.get(`${endpoint}/file/${storageKey}`, {
      responseType: "arraybuffer",
      headers: {
        "X-Tenant": tenantId,
        "X-Region": region || "us"
      }
    });

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "FAX_STORAGE_READ",
      action: "file_retrieved",
      region,
      details: { storageKey }
    });

    return response.data;
  } catch (err) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "FAX_STORAGE_ERROR",
      action: "file_retrieve_failed",
      region,
      details: { storageKey, error: err.message }
    });

    throw new Error(`Storage API error: ${err.message}`);
  }
};
