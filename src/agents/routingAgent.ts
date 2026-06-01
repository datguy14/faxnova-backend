import { runAgent } from './llmClient';
import { routingPrompt } from './prompts/routingPrompt';

export async function handleRoutingDecision({ aiResult, extractedFields, faxMetadata }) {
  const context = { aiResult, extractedFields, faxMetadata };

  return runAgent({
    systemPrompt: routingPrompt,
    userMessage: "Determine the correct routing destination.",
    context,
  });
}
