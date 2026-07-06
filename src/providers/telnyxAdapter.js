// src/providers/telnyxAdapter.js

const axios = require("axios");
const OutboundFax = require("../models/OutboundFax");

exports.sendFax = async fax => {
  const response = await axios.post(
    "https://api.telnyx.com/v2/faxes",
    {
      to: fax.to,
      media_url: fax.storageKey
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
      }
    }
  );

  const providerFaxId = response.data.data.id;

  fax.providerFaxId = providerFaxId;
  fax.status = "processing";
  await fax.save();

  return {
    provider: "telnyx",
    providerFaxId,
    status: "processing"
  };
};
