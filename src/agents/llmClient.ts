export async function runAgent({ systemPrompt, userMessage, context = {} }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({ userMessage, context }) },
  ];

  // TODO: Replace with your actual LLM provider call
  const response = await llm.chat({ messages });

  return response.content;
}
