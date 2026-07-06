// src/workers/outboundFaxWorker.js

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");
const sendFaxService = require("../services/sendFaxService");

module.exports = new Worker(
  "outboundFaxQueue",
  async job => {
    const { faxId } = job.data;
    await sendFaxService.sendFax(faxId);
  },
  { connection }
);
