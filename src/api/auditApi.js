// src/api/auditApi.js

const BASE_URL = import.meta.env.VITE_FAXNOVA_API_URL;
const API_KEY = import.meta.env.VITE_FAXNOVA_API_KEY;

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FaxNova API Error: ${text}`);
  }

  return res.json();
}

export function getAuditLogs() {
  return request("/fax/logs"); // or /audit/logs depending on your backend
}
