const { runAgent } = require('./llmClient');
const { troubleshootingPrompt } = require('./prompts/troubleshootingPrompt');

async function handleTroubleshootingQuestion({ userMessage, faxId, logs }) {
  const context = { faxId, logs };

  return runAgent({
    systemPrompt: troubleshootingPrompt,
    userMessage,
    context,
  });
}

module.exports = { handleTroubleshootingQuestion };
