const { mongoose } = require('../db');

const accountSchema = new mongoose.Schema({
  tenantId: { type: String, unique: true, index: true },
  name: String,
  contactEmail: String,
  plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  billing: {
    stripeCustomerId: String,
    status: { type: String, default: 'trialing' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
