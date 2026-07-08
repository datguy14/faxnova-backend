// src/utils/normalizeStatus.js
// Normalize provider-specific fax status into strict‑mode shape

module.exports = function normalizeStatus(raw) {
  if (!raw) return { state: "unknown", detail: null };

  return {
    state: raw.status || raw.state || "unknown",
    detail: raw.detail || null,
    pages: raw.pages || null,
    direction: raw.direction || null,
    completedAt: raw.completedAt || raw.completed_at || null
  };
};
