'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getProductInformation,
  createShopifyPage,
  updateShopifyProduct,
  generateLiquidCode,
} from './shopify-tools';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(
    z.object({
      text: z.string().optional(),
      media: z.object({ url: z.string() }).optional(),
      toolRequest: z
        .object({
          name: z.string(),
          input: z.any(),
        })
        .optional(),
      toolResponse: z
        .object({
          name: z.string(),
          output: z.any(),
        })
        .optional(),
    })
  ),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string().describe("The user's message."),
  imageUrl: z.string().optional().describe("An optional image URL to include with the message.")
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
    const { history, message, imageUrl } = input;

    const prompt: any[] = [{ text: message }];
    if (imageUrl) {
      prompt.push({ media: { url: imageUrl } });
    }

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      history: history,
      tools: [
        getProductInformation,
        createShopifyPage,
        updateShopifyProduct,
        generateLiquidCode,
      ],
    });

    const response = result.text;
    
    return { response };
  }
);
