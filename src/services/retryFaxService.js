// src/services/retryFaxService.js

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const outboundFaxQueue = new Queue("outboundFaxQueue", { connection });

exports.enqueueInitialSend = async fax => {
  await outboundFaxQueue.add("sendFax", { faxId: fax._id.toString() });
};
