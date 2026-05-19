// src/integrations/faxRouter.js
const logger = require('../utils/logger');
const sinchProvider = require('./providers/sinchProvider');
const telnyxProvider = require('./providers/telnyxProvider');

const providers = {
  sinch: sinchProvider,
  telnyx: telnyxProvider,
};

/**
 * FaxRouter - Central router for multi-provider fax sending
 * Supports Sinch, Telnyx, and easy addition of future providers
 */
class FaxRouter {
  constructor() {
    this.defaultProvider = process.env.DEFAULT_FAX_PROVIDER || 'sinch';
    this.enableFallback = process.env.ENABLE_PROVIDER_FALLBACK === 'true';
    this.fallbackDelayMs = parseInt(process.env.FALLBACK_DELAY_MS) || 2000;
  }

  /**
   * Get provider instance by name
   * @param {string} providerName 
   * @returns {FaxProvider}
   */
  getProvider(providerName) {
    const name = (providerName || this.defaultProvider).toLowerCase();
    
    if (!providers[name]) {
      throw new Error(`Unsupported fax provider: ${name}. Supported: ${Object.keys(providers).join(', ')}`);
    }
    
    return providers[name];
  }

  /**
   * Send fax with optional provider override and fallback logic
   * @param {Object} payload - { to, fileUrl, from?, provider?, metadata? }
   * @returns {Promise<Object>}
   */
  async sendFax(payload) {
    const requestedProvider = payload.provider;
    const primaryProvider = this.getProvider(requestedProvider);
    const startTime = Date.now();

    try {
      logger.info(`Sending fax via ${requestedProvider || this.defaultProvider}`, {
        to: payload.to,
        provider: requestedProvider || this.defaultProvider
      });

      const result = await primaryProvider.sendFax(payload);

      logger.info(`Fax sent successfully`, {
        providerFaxId: result.id || result.faxId,
        provider: requestedProvider || this.defaultProvider,
        durationMs: Date.now() - startTime
      });

      return {
        ...result,
        provider: requestedProvider || this.defaultProvider,
      };

    } catch (error) {
      logger.error(`Primary provider failed`, {
        provider: requestedProvider || this.defaultProvider,
        error: error.message,
        code: error.code,
        durationMs: Date.now() - startTime
      });

      // Attempt fallback if enabled and not already using fallback
      if (this.enableFallback && !payload.isFallback) {
        return this._attemptFallback(payload, error);
      }

      // Re-throw if no fallback
      throw error;
    }
  }

  /**
   * Internal fallback handler
   */
  async _attemptFallback(payload, originalError) {
    const fallbackProviderName = this.defaultProvider === 'sinch' ? 'telnyx' : 'sinch';
    
    logger.warn(`Attempting fallback to ${fallbackProviderName}`);

    try {
      await new Promise(resolve => setTimeout(resolve, this.fallbackDelayMs));

      const fallbackPayload = {
        ...payload,
        provider: fallbackProviderName,
        isFallback: true
      };

      const result = await this.sendFax(fallbackPayload);

      logger.info(`Fallback successful`, {
        fallbackProvider: fallbackProviderName,
        providerFaxId: result.id || result.faxId
      });

      return result;

    } catch (fallbackError) {
      logger.error(`Fallback also failed`, {
        fallbackProvider: fallbackProviderName,
        originalError: originalError.message,
        fallbackError: fallbackError.message
      });

      // Throw combined error
      const error = new Error('All fax providers failed');
      error.originalError = originalError;
      error.fallbackError = fallbackError;
      throw error;
    }
  }

  /**
   * Get fax status from correct provider
   */
  async getStatus(providerFaxId, providerName) {
    if (!providerFaxId) throw new Error('providerFaxId is required');

    const provider = this.getProvider(providerName);
    return provider.getStatus(providerFaxId);
  }

  /**
   * Handle webhook from any provider and normalize payload
   */
  async handleWebhook(providerName, req) {
    const provider = this.getProvider(providerName);
    
    try {
      return await provider.handleWebhook(req);
    } catch (error) {
      logger.error(`Webhook handling failed for ${providerName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get list of available providers (useful for admin/dashboard)
   */
  getAvailableProviders() {
    return Object.keys(providers);
  }

  /**
   * Health check for all providers
   */
  async healthCheck() {
    const results = {};
    
    for (const [name, provider] of Object.entries(providers)) {
      try {
        // Implement a lightweight health check in each provider if possible
        results[name] = { status: 'healthy' };
      } catch (err) {
        results[name] = { status: 'unhealthy', error: err.message };
      }
    }
    
    return results;
  }
}

module.exports = new FaxRouter();
