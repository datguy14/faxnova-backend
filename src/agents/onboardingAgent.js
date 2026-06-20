const { runAgent } = require('./llmClient');
const { onboardingPrompt } = require('./prompts/onboardingPrompt');

async function handleOnboardingQuestion({ userMessage, userId }) {
  const context = { userId };

  return runAgent({
    systemPrompt: onboardingPrompt,
    userMessage,
    context,
  });
}

module.exports = { handleOnboardingQuestion };
