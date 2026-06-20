const { runAgent } = require('./llmClient');
const { billingPrompt } = require('./prompts/billingPrompt');

async function handleBillingQuestion({ userMessage, usage, invoice, plan }) {
  const context = { usage, invoice, plan };

  return runAgent({
    systemPrompt: billingPrompt,
    userMessage,
    context,
  });
}

module.exports = { handleBillingQuestion };
