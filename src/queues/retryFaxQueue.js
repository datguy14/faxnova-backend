// src/queues/retryFaxQueue.js

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const retryFaxQueue = new Queue("retryFaxQueue", { connection });

module.exports = retryFaxQueue;
