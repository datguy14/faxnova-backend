// src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();

// ===== Middleware =====
const agentAuth = require('../middleware/agentAuth');

// Protect all agent endpoints
router.use(agentAuth);

// ===== Import Agents =====
const { handleOnboardingQuestion } = require('../agents/onboardingAgent');
const { handleTroubleshootingQuestion } = require('../agents/troubleshootingAgent');
const { handleRoutingDecision } = require('../agents/routingAgent');
const { handleBillingQuestion } = require('../agents/billingAgent');
const { handleSalesQuestion } = require('../agents/salesAgent');
const { handleComplianceQuestion } = require('../agents/complianceAgent');

// ===== Import Models / Services =====
const Fax = require('../models/Fax');
const FaxLog = require('../models/FaxLog');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Usage = require('../models/Usage');

const { getFaxMetadata } = require('../services/faxMetadataService');
const { getExtractedFields } = require('../services/extractionService');
const { getClassification } = require('../services/classifierService');
const { getProviderContext } = require('../services/providerContextService');


// ==========================================================
// ONBOARDING AGENT
// ==========================================================
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


// ==========================================================
// TROUBLESHOOTING AGENT
// ==========================================================
router.post('/troubleshoot', async (req, res) => {
  try {
    const { faxId } = req.body;
    const user = req.user;

    const fax = await Fax.findById(faxId);
    const logs = await FaxLog.find({ faxId });
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


// ==========================================================
// ROUTING LOGIC AGENT
// ==========================================================
router.post('/routing', async (req, res) => {
  try {
    const { faxId } = req.body;
    const user = req.user;

    const fax = await Fax.findById(faxId);
    const logs = await FaxLog.find({ faxId });
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


// ==========================================================
// BILLING & SUPPORT AGENT
// ==========================================================
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


// ==========================================================
// SALES DEMO AGENT
// ==========================================================
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


// ==========================================================
// COMPLIANCE AGENT
// ==========================================================
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
