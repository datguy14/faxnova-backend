/**
 * Residency-Aware Storage Adapter
 * Routes data writes to zone-specific directories for compliance isolation
 */

const fs = require("fs");
const path = require("path");

/**
 * Get the base storage directory for a residency zone
 * @param {string} zone - Residency zone identifier
 * @returns {string} - Absolute path to zone directory
 */
function getResidencyPath(zone) {
  const basePath = process.env.RESIDENCY_STORAGE_BASE || "./data";
  const zonePath = path.join(basePath, zone || "global");

  // Ensure directory exists
  if (!fs.existsSync(zonePath)) {
    fs.mkdirSync(zonePath, { recursive: true });
  }

  return zonePath;
}

/**
 * Safely construct a file path within a zone directory
 */
function getResidencyFilePath(zone, filename) {
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error(`Invalid filename: ${filename}`);
  }

  const zoneDir = getResidencyPath(zone);
  return path.join(zoneDir, filename);
}

/**
 * Write a line to a residency-partitioned log file
 */
function writeResidencyLog(zone, filename, line) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    fs.appendFileSync(filePath, line + "\n", { flag: "a", encoding: "utf8" });
  } catch (error) {
    console.error(`[Residency Storage] Write failed for ${zone}/${filename}:`, error.message);
    throw error;
  }
}

/**
 * Read from a residency-partitioned log file
 */
function readResidencyLog(zone, filename) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, { encoding: "utf8" });
  } catch (error) {
    console.error(`[Residency Storage] Read failed for ${zone}/${filename}:`, error.message);
    throw error;
  }
}

/**
 * Write a JSON object to a residency-partitioned file
 */
function writeResidencyJSON(zone, filename, data) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: "utf8" });
  } catch (error) {
    console.error(`[Residency Storage] JSON write failed for ${zone}/${filename}:`, error.message);
    throw error;
  }
}

/**
 * Read a JSON object from a residency-partitioned file
 */
function readResidencyJSON(zone, filename) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(content);
  } catch (error) {
    console.error(`[Residency Storage] JSON read failed for ${zone}/${filename}:`, error.message);
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
function deleteResidencyFile(zone, filename) {
  try {
    const filePath = getResidencyFilePath(zone, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`[Residency Storage] Delete failed for ${zone}/${filename}:`, error.message);
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
