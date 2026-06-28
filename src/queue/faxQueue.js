// src/queue/faxQueue.js

const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const faxQueue = new Queue("outboundFaxQueue", { connection });

module.exports = faxQueue;
