'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe("The chat history."),
  message: z.string().describe("The user's message."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message } = input;
    
    const llm = ai.getModel();

    const historyForLlm = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    const result = await llm.generate({
      history: historyForLlm,
      prompt: message,
      output: {
        format: 'text',
      }
    });

    const response = result.output();

    if (typeof response !== 'string') {
        // This should not happen with text format
        throw new Error('Unexpected response format from AI model.');
    }
    
    return { response };
  }
);
