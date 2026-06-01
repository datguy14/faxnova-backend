// src/agents/codeAuditAgent.js

const { applyPatchAndCommit } = require('../services/autoFixService');

module.exports.handleCodeAudit = async function handleCodeAudit({
  fileName,
  fileContent,
  projectContext,
  userMessage,
  autoFix = false,
}) {
  const systemPrompt = `
You are the FaxNova Code Auditor & Auto‑Fix Agent.

Your mission:
1. Audit backend code for security issues, missing validations, unsafe patterns,
   performance problems, missing dependencies, incorrect middleware usage,
   and architectural inconsistencies.
2. Generate a corrected version of the file.
3. Generate a unified patch diff.
4. If autoFix=true, apply the patch to the repository.

Rules:
- Always check for authentication, authorization, ownership checks.
- Always check for missing input validation.
- Always check for missing try/catch blocks.
- Always check for missing async/await.
- Always check for missing dependency imports.
- Always check for unsafe sync I/O.
- Always check for missing environment variable validation.
- Always check for missing rate limiting.
- Always check for missing CORS restrictions.
- Always check for missing error handling.
- Always check for missing provider context injection.
- Always check for missing logging.

Output Format:
### Issues Found
- Issue 1
- Issue 2

### Fixed File
\`\`\`js
// corrected file content here
\`\`\`

### Patch Diff
\`\`\`diff
// unified diff here
\`\`\`

### Explanation
- Why each fix was required
- What risk it prevented
- How it improves the system
`;

  // Call your LLM
  const auditResult = await global.llm.chatCompletion({
    system: systemPrompt,
    user: `
File Name: ${fileName}
Project Context: ${projectContext}
User Message: ${userMessage}

File Content:
${fileContent}
    `,
  });

  const patch = auditResult?.patch;

  if (autoFix && patch) {
    await applyPatchAndCommit({
      fileName,
      patch,
      commitMessage: `Auto‑Fix: ${fileName} — Code Audit Agent`,
    });
  }

  return auditResult;
};
