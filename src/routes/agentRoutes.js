// src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const agentAuth = require('../middleware/agentAuth');

const Fax = require('../models/Fax');
const FaxLog = require('../models/FaxLog');
const AuditLog = require('../models/AuditLog');
const Invoice = require('../models/Invoice');
const Usage = require('../models/Usage');

const { getFaxMetadata } = require('../services/faxMetadataService');
const { getExtractedFields } = require('../services/extractionService');
const { getClassification } = require('../services/classifierService');
const { getProviderContext } = require('../services/providerContextService');

const {
  handleOnboardingQuestion,
  handleTroubleshootingQuestion,
  handleRoutingDecision,
  handleBillingQuestion,
  handleSalesQuestion,
  handleComplianceQuestion,
} = require('../agents');

// 🔐 Protect all agent routes
router.use(agentAuth);

// Rate limiter (proxy‑safe)
const agentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});

router.use(agentLimiter);

/* ============================================================
   ONBOARDING AGENT
============================================================ */
router.post('/onboarding', async (req, res) => {
  try {
    const user = req.user;

    const usage = await Usage.findOne({ userId: user._id });
    const invoices = await Invoice.find({ userId: user._id });

    const response = await handleOnboardingQuestion({
      userMessage: req.body.message,
      user,
      usage,
      invoices,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Onboarding Agent Error:', err);
    res.status(500).json({ success: false, error: 'Onboarding agent failed' });
  }
});

/* ============================================================
   TROUBLESHOOTING AGENT
============================================================ */
router.post('/troubleshoot', async (req, res) => {
  try {
    const { faxId } = req.body;
    const user = req.user;

    const fax = await Fax.findOne({ _id: faxId, userId: user._id });
    if (!fax) return res.status(404).json({ success: false, error: 'Fax not found' });

    const logs = await FaxLog.find({ faxId, userId: user._id });
    const metadata = await getFaxMetadata(faxId);
    const providerContext = await getProviderContext(user.defaultProvider, faxId);

    const response = await handleTroubleshootingQuestion({
      userMessage: req.body.message,
      fax,
      logs,
      metadata,
      user,
      providerContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Troubleshooting Agent Error:', err);
    res.status(500).json({ success: false, error: 'Troubleshooting agent failed' });
  }
});

/* ============================================================
   ROUTING AGENT
============================================================ */
router.post('/routing', async (req, res) => {
  try {
    const { faxId } = req.body;
    const user = req.user;

    const fax = await Fax.findOne({ _id: faxId, userId: user._id });
    if (!fax) return res.status(404).json({ success: false, error: 'Fax not found' });

    const logs = await FaxLog.find({ faxId, userId: user._id });
    const metadata = await getFaxMetadata(faxId);
    const extractedFields = await getExtractedFields(faxId);
    const aiResult = await getClassification(faxId);
    const providerContext = await getProviderContext(user.defaultProvider, faxId);

    const response = await handleRoutingDecision({
      aiResult,
      extractedFields,
      faxMetadata: metadata,
      logs,
      fax,
      user,
      providerContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Routing Agent Error:', err);
    res.status(500).json({ success: false, error: 'Routing agent failed' });
  }
});

/* ============================================================
   BILLING AGENT
============================================================ */
router.post('/billing', async (req, res) => {
  try {
    const user = req.user;

    const usage = await Usage.findOne({ userId: user._id });
    const invoices = await Invoice.find({ userId: user._id });
    const providerContext = await getProviderContext(user.defaultProvider, null);

    const response = await handleBillingQuestion({
      userMessage: req.body.message,
      usage,
      invoice: invoices?.[0] || null,
      plan: user?.plan || null,
      user,
      providerContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Billing Agent Error:', err);
    res.status(500).json({ success: false, error: 'Billing agent failed' });
  }
});

/* ============================================================
   SALES AGENT
============================================================ */
router.post('/sales', async (req, res) => {
  try {
    const user = req.user;

    const usage = await Usage.findOne({ userId: user._id });
    const providerContext = await getProviderContext(user.defaultProvider, null);

    const response = await handleSalesQuestion({
      userMessage: req.body.message,
      leadInfo: user,
      usageEstimate: usage,
      providerContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Sales Agent Error:', err);
    res.status(500).json({ success: false, error: 'Sales agent failed' });
  }
});

/* ============================================================
   COMPLIANCE AGENT
============================================================ */
router.post('/compliance', async (req, res) => {
  try {
    const user = req.user;

    const auditLog = await AuditLog.find({ userId: user._id });
    const providerContext = await getProviderContext(user.defaultProvider, null);

    const response = await handleComplianceQuestion({
      userMessage: req.body.message,
      auditLog,
      securityContext: providerContext,
      user,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Compliance Agent Error:', err);
    res.status(500).json({ success: false, error: 'Compliance agent failed' });
  }
});

module.exports = router;
