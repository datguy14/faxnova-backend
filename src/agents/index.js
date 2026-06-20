const { handleBillingQuestion } = require('./billingAgent');
const { handleComplianceQuestion } = require('./complianceAgent');
const { handleOnboardingQuestion } = require('./onboardingAgent');
const { handleRoutingDecision } = require('./routingAgent');
const { handleSalesQuestion } = require('./salesAgent');
const { handleTroubleshootingQuestion } = require('./troubleshootingAgent');

module.exports = {
  handleBillingQuestion,
  handleComplianceQuestion,
  handleOnboardingQuestion,
  handleRoutingDecision,
  handleSalesQuestion,
  handleTroubleshootingQuestion,
};
