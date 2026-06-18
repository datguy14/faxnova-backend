// src/api/faxApi.js

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

// ⭐ Outbound faxes
export function getOutboundFaxes() {
  return request("/fax/outbound");
}

// ⭐ Inbound faxes
export function getInboundFaxes() {
  return request("/fax/inbound");
}
