'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProductInformation } from './shopify-tools';

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

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: message,
      history: history.map(m => ({role: m.role, content: [{text: m.content}]})),
      tools: [getProductInformation],
    });

    const response = result.text;
    
    return { response };
  }
);
