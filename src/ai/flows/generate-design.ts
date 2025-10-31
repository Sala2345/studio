'use server';
/**
 * @fileOverview A flow for generating designs using AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDesignInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the design to generate.'),
  baseImage: z.string().optional().describe('An optional base image as a data URI.'),
});

export type GenerateDesignInput = z.infer<typeof GenerateDesignInputSchema>;

const GenerateDesignOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});

export type GenerateDesignOutput = z.infer<typeof GenerateDesignOutputSchema>;

export async function generateDesign(input: GenerateDesignInput): Promise<GenerateDesignOutput> {
  return generateDesignFlow(input);
}

const generateDesignFlow = ai.defineFlow(
  {
    name: 'generateDesignFlow',
    inputSchema: GenerateDesignInputSchema,
    outputSchema: GenerateDesignOutputSchema,
  },
  async ({ prompt, baseImage }) => {
    let generationPrompt: any = [{ text: prompt }];
    if (baseImage) {
      generationPrompt.push({ media: { url: baseImage } });
    }

    // Use image-to-image if a base image is provided, otherwise text-to-image.
    const model = baseImage 
      ? 'googleai/gemini-2.5-flash-image-preview' 
      : 'googleai/imagen-4.0-fast-generate-001';

    const config = baseImage 
      ? { responseModalities: ['TEXT', 'IMAGE'] }
      : {};

    const { media, text } = await ai.generate({
      model: model,
      prompt: baseImage ? generationPrompt : prompt,
      ... (baseImage && {config: config})
    });
    
    if (!media?.url) {
      console.error("Image generation failed. Full response:", text);
      throw new Error('Failed to generate image. The model may have refused the prompt.');
    }

    return { imageUrl: media.url };
  }
);
