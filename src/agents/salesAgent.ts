import { runAgent } from './llmClient';
import { salesPrompt } from './prompts/salesPrompt';

export async function handleSalesQuestion({ userMessage, leadInfo, usageEstimate }) {
  const context = { leadInfo, usageEstimate };

  return runAgent({
    systemPrompt: salesPrompt,
    userMessage,
    context,
  });
}
