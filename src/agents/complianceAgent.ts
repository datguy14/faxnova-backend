import { runAgent } from './llmClient';
import { compliancePrompt } from './prompts/compliancePrompt';

export async function handleComplianceQuestion({ userMessage, auditLog, securityContext }) {
  const context = { auditLog, securityContext };

  return runAgent({
    systemPrompt: compliancePrompt,
    userMessage,
    context,
  });
}
