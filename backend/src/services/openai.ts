import OpenAI from 'openai';

let globalClient: OpenAI | null = null;

function getClient(apiKey?: string): OpenAI {
  if (apiKey) return new OpenAI({ apiKey }); // Per-tenant key
  if (!globalClient) globalClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return globalClient;
}

export interface AgentConfig {
  name: string;
  systemRole: string;
  tone: string;
  dos: string[];
  donts: string[];
  knowledgeBase?: string; // Pre-processed text from knowledge docs
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateAgentReply(
  agent: AgentConfig,
  conversationHistory: Message[],
  customerMessage: string,
  openaiKey?: string
): Promise<{ reply: string; tokensUsed: number }> {
  const client = getClient(openaiKey);

  // Build system prompt from agent config
  const systemPrompt = `
You are ${agent.name}, an AI assistant.

YOUR ROLE:
${agent.systemRole}

TONE: ${agent.tone}

DO's:
${agent.dos.map(d => `- ${d}`).join('\n')}

DON'Ts:
${agent.donts.map(d => `- ${d}`).join('\n')}

${agent.knowledgeBase ? `\nKNOWLEDGE BASE:\n${agent.knowledgeBase}` : ''}

Keep responses concise (under 160 words). Use natural conversational language.
Do NOT use markdown formatting in your responses.
`.trim();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Last 10 messages for context
    { role: 'user', content: customerMessage },
  ];

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });

  return {
    reply: completion.choices[0].message.content || "I'm sorry, I couldn't process that. Please try again.",
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}
