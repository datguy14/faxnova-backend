// src/integrations/providers/telnyxProvider.js
const FaxProvider = require('./providerInterface');
const telnyxSDK = require('telnyx');
const logger = require('../../utils/logger');

class TelnyxProvider extends FaxProvider {
  constructor() {
    super();
    this.telnyx = telnyxSDK(process.env.TELNYX_API_KEY);
  }

  /**
   * Send fax via Telnyx
   */
  async sendFax({ to, fileUrl, from, metadata = {} }) {
    if (!to || !fileUrl) {
      throw new Error('to and fileUrl are required for Telnyx');
    }

    try {
      const fax = await this.telnyx.faxes.create({
        connection_id: process.env.TELNYX_CONNECTION_ID,
        to,
        from: from || process.env.TELNYX_FROM_NUMBER,
        media_url: fileUrl,
        ...metadata
      });

      logger.info('Telnyx fax queued', { providerFaxId: fax.data.id });

      return {
        id: fax.data.id,
        status: 'queued',
        provider: 'telnyx',
        ...fax.data
      };
    } catch (error) {
      logger.error('Telnyx sendFax failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get fax status from Telnyx
   */
  async getStatus(providerFaxId) {
    if (!providerFaxId) throw new Error('providerFaxId required');

    const fax = await this.telnyx.faxes.retrieve(providerFaxId);
    
    return {
      status: this.mapStatus(fax.data.status),
      pages: fax.data.page_count,
      ...fax.data
    };
  }

  /**
   * Normalize Telnyx webhook payload
   */
  handleWebhook(req) {
    const event = req.body.data || req.body;
    const payload = event.payload || event;

    return {
      provider: 'telnyx',
      providerFaxId: payload.fax_id || payload.id,
      status: this.mapStatus(payload.status),
      pages: payload.page_count,
      from: payload.from,
      to: payload.to,
      raw: event
    };
  }

  mapStatus(status) {
    const map = {
      'queued': 'queued',
      'media.processed': 'processing',
      'sending': 'sending',
      'delivered': 'delivered',
      'failed': 'failed',
      'receiving': 'receiving',
    };
    return map[status?.toLowerCase()] || status?.toLowerCase() || 'unknown';
  }
}

module.exports = new TelnyxProvider();
