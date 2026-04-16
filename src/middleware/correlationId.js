const { randomUUID } = require('crypto');

module.exports = (req, res, next) => {
  const headerId =
    req.headers['x-correlation-id'] || req.headers['X-Correlation-Id'];

  const correlationId = headerId || randomUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  next();
};
