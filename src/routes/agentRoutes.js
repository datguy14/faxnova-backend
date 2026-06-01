// src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();

// ===== Import Agents =====
const { handleOnboardingQuestion } = require('../agents/onboardingAgent');
const { handleTroubleshootingQuestion } = require('../agents/troubleshootingAgent');
const { handleRoutingDecision } = require('../agents/routingAgent');
const { handleBillingQuestion } = require('../agents/billingAgent');
const { handleSalesQuestion } = require('../agents/salesAgent');
const { handleComplianceQuestion } = require('../agents/complianceAgent');

// ===== Import Models / Services for Context Injection =====
const Fax = require('../models/Fax');
const FaxLog = require('../models/FaxLog');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Usage = require('../models/Usage');

const { getFaxMetadata } = require('../services/faxMetadataService');
const { getExtractedFields } = require('../services/extractionService');
const { getClassification } = require('../services/classifierService');


// ==========================================================
// ONBOARDING AGENT
// ==========================================================
router.post('/onboarding', async (req, res) => {
  try {
    const { message, userId } = req.body;

    const user = await User.findById(userId);
    const usage = await Usage.findOne({ userId });
    const invoices = await Invoice.find({ userId });

    const response = await handleOnboardingQuestion({
      userMessage: message,
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
    const { message, faxId } = req.body;

    const fax = await Fax.findById(faxId);
    const logs = await FaxLog.find({ faxId });
    const metadata = await getFaxMetadata(faxId);

    const response = await handleTroubleshootingQuestion({
      userMessage: message,
      fax,
      logs,
      metadata,
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

    const fax = await Fax.findById(faxId);
    const logs = await FaxLog.find({ faxId });
    const metadata = await getFaxMetadata(faxId);
    const extractedFields = await getExtractedFields(faxId);
    const aiResult = await getClassification(faxId);

    const response = await handleRoutingDecision({
      aiResult,
      extractedFields,
      faxMetadata: metadata,
      logs,
      fax,
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
    const { message, userId } = req.body;

    const usage = await Usage.findOne({ userId });
    const invoices = await Invoice.find({ userId });
    const user = await User.findById(userId);

    const response = await handleBillingQuestion({
      userMessage: message,
      usage,
      invoice: invoices?.[0] || null,
      plan: user?.plan || null,
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
    const { message, userId } = req.body;

    const user = await User.findById(userId);
    const usage = await Usage.findOne({ userId });

    const response = await handleSalesQuestion({
      userMessage: message,
      leadInfo: user,
      usageEstimate: usage,
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
    const { message, userId } = req.body;

    const auditLog = await AuditLog.find({ userId });
    const user = await User.findById(userId);

    const response = await handleComplianceQuestion({
      userMessage: message,
      auditLog,
      securityContext: {
        provider: user?.defaultProvider || 'sinch',
        encryption: true,
        hipaa: true,
      },
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Compliance Agent Error:', err);
    res.status(500).json({ success: false, error: 'Compliance agent failed' });
  }
});


module.exports = router;
