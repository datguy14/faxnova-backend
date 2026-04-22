const axios = require('axios');

const client = axios.create({
  baseURL: `https://fax.${process.env.SINCH_FAX_REGION}.sinch.com/v3`,
  headers: {
    'X-API-KEY': process.env.SINCH_API_KEY,
    'X-API-SECRET': process.env.SINCH_API_SECRET,
  },
});

module.exports = {
  sendFax: async (payload) => {
    const res = await client.post('/faxes', payload);
    return res.data;
  },

  getFaxStatus: async (id) => {
    const res = await client.get(`/faxes/${id}`);
    return res.data;
  },

  retryFax: async (id) => {
    const res = await client.post(`/faxes/${id}/retry`);
    return res.data;
  },
};
