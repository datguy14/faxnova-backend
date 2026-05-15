// src/services/faxRetryService.js
const { sinchRequest } = require('../sinchAuth');

function validateFaxId(faxId) {
  return /^[a-zA-Z0-9-]{8,}$/.test(faxId);
}

exports.retryFax = async (faxId, correlationId) => {
  if (!validateFaxId(faxId)) {
    const err = new Error("Invalid faxId format");
    err.status = 400;
    throw err;
  }

  const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/fax/${faxId}/retry`;

  const resp = await sinchRequest({
    method: 'POST',
    url,
    data: {},
    headers: {
      'X-Correlation-ID': correlationId
    }
  });

  if (resp.status >= 400) {
    const err = new Error("Sinch retryFax failed");
    err.status = resp.status;
    err.details = resp.data;
    err.correlationId = correlationId;
    throw err;
  }

  return resp.data;
};
