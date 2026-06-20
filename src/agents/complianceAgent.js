const { runAgent } = require('./llmClient');
const { compliancePrompt } = require('./prompts/compliancePrompt');

async function handleComplianceQuestion({ userMessage, auditLog, securityContext }) {
  const context = { auditLog, securityContext };

  return runAgent({
    systemPrompt: compliancePrompt,
    userMessage,
    context,
  });
}

module.exports = { handleComplianceQuestion };
