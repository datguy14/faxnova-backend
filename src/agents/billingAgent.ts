import { runAgent } from './llmClient';
import { billingPrompt } from './prompts/billingPrompt';

export async function handleBillingQuestion({ userMessage, usage, invoice, plan }) {
  const context = { usage, invoice, plan };

  return runAgent({
    systemPrompt: billingPrompt,
    userMessage,
    context,
  });
}
