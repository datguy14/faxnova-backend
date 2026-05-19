// src/integrations/providers/sinchProvider.js
const FaxProvider = require('./providerInterface');
const axios = require('axios');
const logger = require('../../utils/logger');

class SinchProvider extends FaxProvider {
  constructor() {
    super();
    this.baseURL = 'https://fax.api.sinch.com/v3';
    this.projectId = process.env.SINCH_PROJECT_ID; // Required for v3

    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: process.env.SINCH_API_KEY,
        password: process.env.SINCH_API_SECRET,
      },
    });
  }

  /**
   * Send fax via Sinch
   * Supports both contentUrl and file upload (contentUrl preferred for simplicity)
   */
  async sendFax({ to, fileUrl, from, metadata = {} }) {
    if (!to || !fileUrl) {
      throw new Error('to and fileUrl are required for Sinch');
    }

    const payload = {
      to: to,
      contentUrl: fileUrl,
      from: from || process.env.SINCH_FAX_NUMBER,
      ...metadata
    };

    try {
      const response = await this.client.post(`/projects/${this.projectId}/faxes`, payload);
      
      logger.info('Sinch fax queued', { providerFaxId: response.data.id });
      
      return {
        id: response.data.id,
        status: 'queued',
        provider: 'sinch',
        ...response.data
      };
    } catch (error) {
      logger.error('Sinch sendFax failed', { error: error.response?.data || error.message });
      throw error;
    }
  }

  /**
   * Get fax status from Sinch
   */
  async getStatus(providerFaxId) {
    if (!providerFaxId) throw new Error('providerFaxId required');

    const response = await this.client.get(`/projects/\( {this.projectId}/faxes/ \){providerFaxId}`);
    
    return {
      status: this.mapStatus(response.data.status),
      pages: response.data.numberOfPages,
      ...response.data
    };
  }

  /**
   * Normalize Sinch webhook payload
   */
  handleWebhook(req) {
    const event = req.body.event || req.body;
    const fax = event.fax || event;

    return {
      provider: 'sinch',
      providerFaxId: fax.id,
      status: this.mapStatus(fax.status),
      pages: fax.numberOfPages,
      from: fax.from,
      to: fax.to,
      raw: event
    };
  }

  mapStatus(status) {
    const map = {
      'QUEUED': 'queued',
      'SENDING': 'sending',
      'DELIVERED': 'delivered',
      'FAILED': 'failed',
      'COMPLETED': 'delivered',
      // Add more as needed
    };
    return map[status?.toUpperCase()] || status?.toLowerCase() || 'unknown';
  }
}

module.exports = new SinchProvider();
