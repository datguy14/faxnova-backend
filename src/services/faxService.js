// src/services/faxService.js

const outboundFaxService = require("./outboundFaxService");

exports.createOutboundFax = async payload => {
  return outboundFaxService.processOutboundFax(payload);
};
