const { mongoose } = require('../db');

const apiKeySchema = new mongoose.Schema({
  tenantId: { type: String, index: true },
  keyHash: { type: String, unique: true, index: true },
  label: String,
  tier: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  limits: {
    maxPerMinute: Number,
    maxPerDay: Number
  },
  lastUsedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('ApiKey', apiKeySchema);
