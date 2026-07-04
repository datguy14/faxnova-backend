// src/services/faxStorageService.js

const axios = require("axios");

exports.storeFax = async ({ buffer, filename }) => {
  try {
    const endpoint = process.env.STORAGE_API_URL;

    const response = await axios.post(`${endpoint}/upload`, buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": filename
      }
    });

    return {
      storageKey: response.data.storageKey
    };
  } catch (err) {
    throw new Error(`Storage API error: ${err.message}`);
  }
};

exports.getFaxFile = async (storageKey) => {
  try {
    const endpoint = process.env.STORAGE_API_URL;

    const response = await axios.get(`${endpoint}/file/${storageKey}`, {
      responseType: "arraybuffer"
    });

    return response.data;
  } catch (err) {
    throw new Error(`Storage API error: ${err.message}`);
  }
};
