// src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();

// Import all agents
const { handleOnboardingQuestion } = require('../agents/onboardingAgent');
const { handleTroubleshootingQuestion } = require('../agents/troubleshootingAgent');
const { handleRoutingDecision } = require('../agents/routingAgent');
const { handleBillingQuestion } = require('../agents/billingAgent');
const { handleSalesQuestion } = require('../agents/salesAgent');
const { handleComplianceQuestion } = require('../agents/complianceAgent');

// ===============================
// Onboarding Agent
// ===============================
router.post('/onboarding', async (req, res) => {
  try {
    const { message, userId } = req.body;

    const response = await handleOnboardingQuestion({
      userMessage: message,
      userId,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Onboarding Agent Error:', err);
    res.status(500).json({ success: false, error: 'Onboarding agent failed' });
  }
});

// ===============================
// Troubleshooting Agent
// ===============================
router.post('/troubleshoot', async (req, res) => {
  try {
    const { message, faxId, logs } = req.body;

    const response = await handleTroubleshootingQuestion({
      userMessage: message,
      faxId,
      logs,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Troubleshooting Agent Error:', err);
    res.status(500).json({ success: false, error: 'Troubleshooting agent failed' });
  }
});

// ===============================
// Routing Logic Agent
// ===============================
router.post('/routing', async (req, res) => {
  try {
    const { aiResult, extractedFields, faxMetadata } = req.body;

    const response = await handleRoutingDecision({
      aiResult,
      extractedFields,
      faxMetadata,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Routing Agent Error:', err);
    res.status(500).json({ success: false, error: 'Routing agent failed' });
  }
});

// ===============================
// Billing & Support Agent
// ===============================
router.post('/billing', async (req, res) => {
  try {
    const { message, usage, invoice, plan } = req.body;

    const response = await handleBillingQuestion({
      userMessage: message,
      usage,
      invoice,
      plan,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Billing Agent Error:', err);
    res.status(500).json({ success: false, error: 'Billing agent failed' });
  }
});

// ===============================
// Sales Demo Agent
// ===============================
router.post('/sales', async (req, res) => {
  try {
    const { message, leadInfo, usageEstimate } = req.body;

    const response = await handleSalesQuestion({
      userMessage: message,
      leadInfo,
      usageEstimate,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Sales Agent Error:', err);
    res.status(500).json({ success: false, error: 'Sales agent failed' });
  }
});

// ===============================
// Compliance Agent
// ===============================
router.post('/compliance', async (req, res) => {
  try {
    const { message, auditLog, securityContext } = req.body;

    const response = await handleComplianceQuestion({
      userMessage: message,
      auditLog,
      securityContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Compliance Agent Error:', err);
    res.status(500).json({ success: false, error: 'Compliance agent failed' });
  }
});

module.exports = router;
