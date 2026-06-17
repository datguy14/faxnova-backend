// src/controllers/provider.controller.js
import { providerRouter } from "../services/providerRouter.js";
import { providerPerformanceService } from "../services/providerPerformanceService.js";
import { providerOutageService } from "../services/providerOutageService.js";
import { providerBillingService } from "../services/providerBillingService.js";
import { providerRoutingRules } from "../services/providerRoutingRules.js";
import { auditService } from "../services/auditService.js";

/**
 * GET /providers
 * Returns all providers + routing metadata + residency rules.
 */
export async function getAllProviders(req, res, next) {
  try {
    const providers = providerRoutingRules.getAllProviders();

    await auditService.log({
      action: "GET_ALL_PROVIDERS",
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    res.json({ providers });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /providers/status
 * Returns real-time provider health + routing availability.
 */
export async function getProviderStatus(req, res, next) {
  try {
    const status = await providerRouter.getProviderStatus();

    await auditService.log({
      action: "GET_PROVIDER_STATUS",
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    res.json({ status });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /providers/performance
 * Returns provider performance scoring (latency, success rate, cost).
 */
export async function getProviderPerformance(req, res, next) {
  try {
    const performance = await providerPerformanceService.getPerformanceSummary();

    await auditService.log({
      action: "GET_PROVIDER_PERFORMANCE",
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    res.json({ performance });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /providers/outages
 * Returns provider outage history + active incidents.
 */
export async function getProviderOutages(req, res, next) {
  try {
    const outages = await providerOutageService.getOutageSummary();

    await auditService.log({
      action: "GET_PROVIDER_OUTAGES",
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    res.json({ outages });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /providers/billing
 * Returns provider billing metrics (cost per page, per region, etc.).
 */
export async function getProviderBilling(req, res, next) {
  try {
    const billing = await providerBillingService.getBillingSummary();

    await auditService.log({
      action: "GET_PROVIDER_BILLING",
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    res.json({ billing });
  } catch (err) {
    next(err);
  }
}
