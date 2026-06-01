// src/agents/index.js

module.exports = {
  handleOnboardingQuestion: require('./onboardingAgent'),
  handleTroubleshootingQuestion: require('./troubleshootingAgent'),
  handleRoutingDecision: require('./routingAgent'),
  handleBillingQuestion: require('./billingAgent'),
  handleSalesQuestion: require('./salesAgent'),
  handleComplianceQuestion: require('./complianceAgent'),
  handleCodeAudit: require('./codeAuditAgent'),
};
