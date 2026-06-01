import { runAgent } from './llmClient';
import { troubleshootingPrompt } from './prompts/troubleshootingPrompt';

export async function handleTroubleshootingQuestion({ userMessage, faxId, logs }) {
  const context = { faxId, logs };

  return runAgent({
    systemPrompt: troubleshootingPrompt,
    userMessage,
    context,
  });
}
