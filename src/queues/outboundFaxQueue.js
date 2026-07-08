// src/queues/outboundFaxQueue.js — Unified Fax Architecture (CommonJS Only)

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const outboundFaxQueue = new Queue("outboundFaxQueue", { connection });

module.exports = outboundFaxQueue;
