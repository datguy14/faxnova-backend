// src/storage/faxStorageService.js — Unified Fax Architecture (CommonJS Only)

const path = require("path");
const fs = require("fs");

module.exports = {
  async storeFax({ tenantId, faxId, buffer, filename, region }) {
    try {
      const storageKey = `${tenantId}/${region}/${faxId}/${filename}`;
      const fullPath = path.join(__dirname, "../../storage", storageKey);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      // Write file
      fs.writeFileSync(fullPath, buffer);

      return {
        ok: true,
        storageKey,
        fullPath
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message
      };
    }
  },

  async getFax(storageKey) {
    try {
      const fullPath = path.join(__dirname, "../../storage", storageKey);

      if (!fs.existsSync(fullPath)) {
        return { ok: false, error: "File not found" };
      }

      const buffer = fs.readFileSync(fullPath);

      return {
        ok: true,
        buffer,
        storageKey,
        fullPath
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message
      };
    }
  }
};
