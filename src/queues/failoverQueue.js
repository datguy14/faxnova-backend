// src/queues/failoverQueue.js — Unified Fax Architecture (CommonJS Only)

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const failoverQueue = new Queue("failoverQueue", { connection });

module.exports = failoverQueue;
