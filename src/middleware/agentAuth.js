// src/middleware/agentAuth.js
const User = require('../models/User');

module.exports = async function agentAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-faxnova-key'];

    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'Missing API key' });
    }

    const user = await User.findOne({ apiKey });

    if (!user) {
      return res.status(403).json({ success: false, error: 'Invalid API key' });
    }

    // Attach user to request for downstream agents
    req.user = user;

    next();
  } catch (err) {
    console.error('Agent Auth Error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};
