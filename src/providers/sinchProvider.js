const axios = require("axios");

const SINCH_BASE = "https://api.sinch.com/v1/projects";

module.exports = {
  async sendFax({ to, from, mediaUrl }) {
    const url = `${SINCH_BASE}/${process.env.SINCH_PROJECT_ID}/faxes`;

    const payload = {
      to,
      from,
      mediaUrl
    };

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${process.env.SINCH_API_KEY}:${process.env.SINCH_API_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/json"
    };

    const res = await axios.post(url, payload, { headers });
    return res.data;
  },

  async getFaxStatus(faxId) {
    const url = `${SINCH_BASE}/${process.env.SINCH_PROJECT_ID}/faxes/${faxId}`;

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${process.env.SINCH_API_KEY}:${process.env.SINCH_API_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/json"
    };

    const res = await axios.get(url, { headers });
    return res.data;
  }
};
