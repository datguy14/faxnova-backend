// src/services/providerCircuitBreaker.js — BROKEN
const sendToProvider = require("./sendFaxService"); // WRONG: exports { sendFax }, not sendToProvider

// src/services/sendFaxService.js — BROKEN
const breaker = require("./providerCircuitBreaker"); // CIRCULAR
