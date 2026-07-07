// src/storage/residencyStorageService.js — Unified Fax Architecture

const fs = require("fs");
const path = require("path");
const auditService = require("../services/auditService");

/**
 * Residency-Aware Storage Adapter
 * Routes data writes to zone-specific directories for compliance isolation.
 * Zones typically match: us, eu, apac, etc.
 */

function getResidencyPath(zone) {
  const basePath = process.env.RESIDENCY_STORAGE_BASE || "./data";
  const zonePath = path.join(basePath, zone || "global");

  if (!fs.existsSync(zonePath)) {
    fs.mkdirSync(zonePath, { recursive: true });
  }

  return zonePath;
}

/**
 * Safely construct a file path within a zone directory
 */
function getResidencyFilePath(zone, filename) {
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error(`Invalid filename: ${filename}`);
  }

  const zoneDir = getResidencyPath(zone);
  return path.join(zoneDir, filename);
}

/**
 * Write a line to a residency-partitioned log file
 */
async function writeResidencyLog({ tenantId, faxId, zone, filename, line }) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    fs.appendFileSync(filePath, line + "\n", { flag: "a", encoding: "utf8" });

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_WRITE",
      action: "log_write",
      region: zone,
      details: { filename }
    });
  } catch (error) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_ERROR",
      action: "log_write_failed",
      region: zone,
      details: { filename, error: error.message }
    });

    throw error;
  }
}

/**
 * Read from a residency-partitioned log file
 */
async function readResidencyLog({ tenantId, faxId, zone, filename }) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    if (!fs.existsSync(filePath)) return "";

    const content = fs.readFileSync(filePath, { encoding: "utf8" });

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_READ",
      action: "log_read",
      region: zone,
      details: { filename }
    });

    return content;
  } catch (error) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_ERROR",
      action: "log_read_failed",
      region: zone,
      details: { filename, error: error.message }
    });

    throw error;
  }
}

/**
 * Write a JSON object to a residency-partitioned file
 */
async function writeResidencyJSON({ tenantId, faxId, zone, filename, data }) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
      encoding: "utf8"
    });

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_WRITE",
      action: "json_write",
      region: zone,
      details: { filename }
    });
  } catch (error) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_ERROR",
      action: "json_write_failed",
      region: zone,
      details: { filename, error: error.message }
    });

    throw error;
  }
}

/**
 * Read a JSON object from a residency-partitioned file
 */
async function readResidencyJSON({ tenantId, faxId, zone, filename }) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    const parsed = JSON.parse(content);

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_READ",
      action: "json_read",
      region: zone,
      details: { filename }
    });

    return parsed;
  } catch (error) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_ERROR",
      action: "json_read_failed",
      region: zone,
      details: { filename, error: error.message }
    });

    throw error;
  }
}

/**
 * List all files in a zone directory
 */
function listResidencyFiles(zone) {
  try {
    const zonePath = getResidencyPath(zone);
    return fs.readdirSync(zonePath);
  } catch (error) {
    console.error(`[Residency Storage] List failed for ${zone}:`, error.message);
    return [];
  }
}

/**
 * Delete a file from a zone directory
 */
async function deleteResidencyFile({ tenantId, faxId, zone, filename }) {
  try {
    const filePath = getResidencyFilePath(zone, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_DELETE",
      action: "file_deleted",
      region: zone,
      details: { filename }
    });
  } catch (error) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_STORAGE_ERROR",
      action: "file_delete_failed",
      region: zone,
      details: { filename, error: error.message }
    });

    throw error;
  }
}

module.exports = {
  getResidencyPath,
  getResidencyFilePath,
  writeResidencyLog,
  readResidencyLog,
  writeResidencyJSON,
  readResidencyJSON,
  listResidencyFiles,
  deleteResidencyFile
};
