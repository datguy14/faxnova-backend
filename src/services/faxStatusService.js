// src/services/faxStatusService.js
const { sinchRequest } = require('../sinchAuth');

function validateFaxId(faxId) {
  return /^[a-zA-Z0-9-]{8,}$/.test(faxId);
}

exports.getFaxStatus = async (faxId) => {
  if (!validateFaxId(faxId)) {
    const err = new Error("Invalid faxId format");
    err.status = 400;
    throw err;
  }

  const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes/${faxId}`;

  const resp = await sinchRequest({
    method: 'GET',
    url
  });

  if (resp.status >= 400) {
    const err = new Error("Sinch getFaxStatus failed");
    err.status = resp.status;
    err.details = resp.data;
    throw err;
  }

  return resp.data;
};
