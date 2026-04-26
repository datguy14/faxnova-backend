// middleware/auth.js
// Validates Bearer API key on all protected routes.
// Set FAXNOVA_API_KEY in your environment to enable authentication.
// Requests must include: Authorization: Bearer <key>

module.exports = function auth(req, res, next) {
  const expectedKey = process.env.FAXNOVA_API_KEY;

  // Hard block if key is not configured in production
  if (!expectedKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        level: 'error',
        message: 'FAXNOVA_API_KEY is not set — rejecting all requests in production',
        correlationId: req.correlationId,
      }));
      return res.status(500).json({
        error: 'Server misconfiguration: API key not set',
      });
    }
    // Dev mode: allow through with warning
    console.warn(JSON.stringify({
      level: 'warn',
      message: 'FAXNOVA_API_KEY not set — auth is DISABLED (dev mode only)',
      correlationId: req.correlationId,
    }));
    return next();
  }

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Missing or malformed Authorization header. Expected: Bearer <api_key>',
      correlationId: req.correlationId,
    });
  }

  const providedKey = authHeader.slice(7).trim(); // strip 'Bearer '

  if (providedKey !== expectedKey) {
    return res.status(403).json({
      error: 'Forbidden',
      details: 'Invalid API key',
      correlationId: req.correlationId,
    });
  }

  next();
};
