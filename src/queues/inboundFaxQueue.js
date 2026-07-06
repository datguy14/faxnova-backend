// src/queues/inboundFaxQueue.js

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const inboundFaxQueue = new Queue("inboundFaxQueue", { connection });

module.exports = inboundFaxQueue;
