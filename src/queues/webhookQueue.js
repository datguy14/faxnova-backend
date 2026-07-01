// src/queues/webhookQueue.js

const { Queue } = require("bullmq");
const connection = require("../lib/redis");

module.exports = new Queue("webhookQueue", { connection });
