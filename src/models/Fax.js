const { mongoose } = require('../db');

const faxSchema = new mongoose.Schema({
  tenantId: { type: String, index: true },
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  direction: { type: String, enum: ['outbound', 'inbound'] },
  to: String,
  from: String,
  status: {
    type: String,
    enum: ['queued', 'sending', 'delivered', 'failed'],
    index: true
  },
  providerFaxId: { type: String, index: true },
  pages: Number,
  errorCode: String,
  errorMessage: String,
  metadata: {
    correlationId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Fax', faxSchema);
