// src/workers/workerErrorHandler.js — Unified Fax Architecture (CommonJS Only)

const auditService = require("../services/auditService");

module.exports = function workerErrorHandler(workerName, err) {
  console.error(`WORKER ERROR [${workerName}]:`, err);

  auditService.logEvent({
    type: "WORKER_ERROR",
    details: {
      worker: workerName,
      message: err.message,
      stack: err.stack
    }
  });
};
