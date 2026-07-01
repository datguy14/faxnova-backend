// src/errors/WebhookError.js

const FaxError = require("./FaxError");

class WebhookError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = WebhookError;
