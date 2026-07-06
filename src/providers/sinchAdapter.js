// src/providers/sinchAdapter.js

const axios = require("axios");
const OutboundFax = require("../models/OutboundFax");

exports.sendFax = async fax => {
  const response = await axios.post(
    "https://api.sinch.com/fax/v1/send",
    {
      to: fax.to,
      document: fax.storageKey
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SINCH_API_KEY}`
      }
    }
  );

  const providerFaxId = response.data.id;

  fax.providerFaxId = providerFaxId;
  fax.status = "processing";
  await fax.save();

  return {
    provider: "sinch",
    providerFaxId,
    status: "processing"
  };
};
