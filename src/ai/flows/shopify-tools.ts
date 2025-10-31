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
    description: 'Get information about products from the Shopify store. Call this tool without a query to get a list of all products.',
    inputSchema: z.object({
      query: z.string().optional().describe('An optional search query to find specific products. Can be a product name, tag, or other criteria.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    console.log(`Getting product information for query: ${input.query}`);
    // If query is an empty string, we want to treat it as if no query was provided.
    const query = input.query || undefined;
    return getProducts(query);
  }
);
