// src/api/faxApi.js
const BASE_URL = import.meta.env.VITE_FAXNOVA_API_URL;
const API_KEY = import.meta.env.VITE_FAXNOVA_API_KEY;

export async function getOutboundFaxes() {
  const res = await fetch(`${BASE_URL}/fax/outbound`, {
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch outbound faxes");
  }

  return res.json();
}
