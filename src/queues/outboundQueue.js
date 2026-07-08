// src/queues/outboundQueue.js — Unified Fax Architecture (CommonJS Only)

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const outboundQueue = new Queue("outboundQueue", { connection });

module.exports = outboundQueue;
