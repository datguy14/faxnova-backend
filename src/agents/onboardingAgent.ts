import { runAgent } from './llmClient';
import { onboardingPrompt } from './prompts/onboardingPrompt';

export async function handleOnboardingQuestion({ userMessage, userId }) {
  const context = { userId };

  return runAgent({
    systemPrompt: onboardingPrompt,
    userMessage,
    context,
  });
}
