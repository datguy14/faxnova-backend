// src/workers/retryFaxWorker.js

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");
const retryFaxService = require("../services/retryFaxService");

module.exports = new Worker(
  "retryFaxQueue",
  async job => {
    const { faxId } = job.data;
    await retryFaxService.retryFax(faxId);
  },
  { connection }
);
