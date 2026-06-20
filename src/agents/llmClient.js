// llmClient.js
// Simple wrapper for calling your LLM provider

const llm = require('../utils/llm'); 
// ^ Adjust this path if your LLM client lives somewhere else.
// If you don't have an llm client yet, I can generate one.

async function runAgent({ systemPrompt, userMessage, context = {} }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({ userMessage, context }) },
  ];

  // Call your LLM provider
  const response = await llm.chat({ messages });

  return response.content;
}

module.exports = { runAgent };
