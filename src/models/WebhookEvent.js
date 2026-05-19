const { mongoose } = require('../db');

const webhookEventSchema = new mongoose.Schema({
  tenantId: { type: String, index: true },
  faxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fax' },
  providerFaxId: { type: String, index: true },
  status: String,
  rawPayload: Object,
  processingStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: String,
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
