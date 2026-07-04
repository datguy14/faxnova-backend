// src/middleware/correlationId.js

module.exports = (req, res, next) => {
  const incoming =
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"];

  const correlationId =
    incoming ||
    `cid_${Math.random().toString(36).slice(2)}`;

  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  next();
};
