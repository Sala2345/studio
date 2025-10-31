'use server';
/**
 * @fileOverview Tools for interacting with the Shopify API.
 */

import { ai } from '@/ai/genkit';
import { getProducts } from '@/services/shopify';
import { z } from 'zod';

export const getProductInformation = ai.defineTool(
  {
    name: 'getProductInformation',
    description: 'Get information about products from the Shopify store.',
    inputSchema: z.object({
      query: z.string().describe('A search query to find products. Can be a product name, tag, or other criteria.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    console.log(`Getting product information for query: ${input.query}`);
    return getProducts(input.query);
  }
);
