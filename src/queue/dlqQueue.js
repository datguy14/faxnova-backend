// src/queue/dlqQueue.js

const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const dlqQueue = new Queue("faxDLQ", { connection });

module.exports = dlqQueue;
