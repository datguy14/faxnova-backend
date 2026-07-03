/**
 * src/controllers/provider.controller.js
 *
 * Provider management controller with structured error responses.
 * All endpoints return consistent JSON structure with success flag and metadata.
 */

const providerDiagnosticsService = require("../services/providerDiagnosticsService");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerHealthService = require("../services/providerHealthService");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

/**
 * Get all provider diagnostics (health, outage, performance, latency)
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
async function getAllProviders(req, res, next) {
  try {
    const diagnostics = await providerDiagnosticsService.getAllDiagnostics();

    audit.log("provider_diagnostics_viewed", {
      user: req.user?.id,
      providerCount: diagnostics.length
    });

    return res.status(200).json({
      success: true,
      data: diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[provider.controller] Error fetching providers:", err);
    return next(err);
  }
}

/**
 * Get unified provider health status
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
async function getProviderStatus(req, res, next) {
  try {
    const summary = await providerDiagnosticsService.getHealthSummary();

    audit.log("provider_status_viewed", {
      user: req.user?.id,
      overallStatus: summary.overallStatus
    });

    return res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[provider.controller] Error fetching status:", err);
    return next(err);
  }
}

/**
 * Get provider performance metrics (scores, success rates)
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
async function getProviderPerformance(req, res, next) {
  try {
    const scores = await providerPerformanceService.getScores();
    const diagnostics = await providerDiagnosticsService.getAllDiagnostics();

    audit.log("provider_performance_viewed", {
      user: req.user?.id
    });

    return res.status(200).json({
      success: true,
      data: {
        scores,
        diagnostics
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[provider.controller] Error fetching performance:", err);
    return next(err);
  }
}

/**
 * Get all provider health states
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
async function getProviderHealth(req, res, next) {
  try {
    const health = await providerHealthService.getAllHealth();

    audit.log("provider_health_viewed", {
      user: req.user?.id
    });

    return res.status(200).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[provider.controller] Error fetching health:", err);
    return next(err);
  }
}

/**
 * Get provider diagnostics export (for debugging/monitoring)
 *
 * @param {object} req - Express request with optional ?provider=<name> query param
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
async function getDiagnostics(req, res, next) {
  try {
    const provider = req.query.provider;

    if (provider) {
      // Single provider diagnostics
      const diagnostic = await providerDiagnosticsService.getProviderDiagnostics(provider);

      audit.log("provider_diagnostics_exported", {
        user: req.user?.id,
        provider
      });

      return res.status(200).json({
        success: true,
        data: diagnostic,
        timestamp: new Date().toISOString()
      });
    } else {
      // All providers diagnostics
      const diagnostics = await providerDiagnosticsService.getAllDiagnostics();

      audit.log("provider_diagnostics_exported", {
        user: req.user?.id,
        all: true
      });

      return res.status(200).json({
        success: true,
        data: diagnostics,
        timestamp: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error("[provider.controller] Error exporting diagnostics:", err);
    return next(err);
  }
}

module.exports = {
  getAllProviders,
  getProviderStatus,
  getProviderPerformance,
  getProviderHealth,
  getDiagnostics
};
