// src/queue/retryQueue.js

const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const retryQueue = new Queue("faxRetryQueue", { connection });

module.exports = retryQueue;
