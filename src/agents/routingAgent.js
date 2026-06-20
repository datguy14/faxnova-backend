const { runAgent } = require('./llmClient');
const { routingPrompt } = require('./prompts/routingPrompt');

async function handleRoutingDecision({ aiResult, extractedFields, faxMetadata }) {
  const context = { aiResult, extractedFields, faxMetadata };

  return runAgent({
    systemPrompt: routingPrompt,
    userMessage: "Determine the correct routing destination.",
    context,
  });
}

module.exports = { handleRoutingDecision };
