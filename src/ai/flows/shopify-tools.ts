'use server';
/**
 * @fileOverview Tools for interacting with the Shopify API.
 */

import { ai } from '@/ai/genkit';
import {
  getProducts,
  createPage,
  updateProduct,
} from '@/services/shopify';
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

export const createShopifyPage = ai.defineTool(
  {
    name: 'createShopifyPage',
    description: 'Creates a new page on the Shopify store.',
    inputSchema: z.object({
      title: z.string().describe('The title of the page.'),
      bodyHtml: z.string().describe('The HTML content for the page body.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    console.log(`Creating Shopify page with title: ${input.title}`);
    return createPage(input.title, input.bodyHtml);
  }
);

export const updateShopifyProduct = ai.defineTool(
  {
    name: 'updateShopifyProduct',
    description: 'Updates an existing product on the Shopify store.',
    inputSchema: z.object({
      productId: z
        .string()
        .describe(
          'The ID of the product to update (e.g., "gid://shopify/Product/12345").'
        ),
      productInput: z
        .object({
          title: z.string().optional(),
          bodyHtml: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .describe('The product fields to update.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    console.log(`Updating Shopify product with ID: ${input.productId}`);
    return updateProduct(input.productId, input.productInput);
  }
);

export const generateLiquidCode = ai.defineTool(
  {
    name: 'generateLiquidCode',
    description: 'Generates Shopify Liquid code based on a user request. This is for generating code snippets, not for executing them.',
    inputSchema: z.object({
      request: z.string().describe('A detailed description of the Liquid code to be generated.'),
    }),
    outputSchema: z.object({
      liquidCode: z.string().describe('The generated Liquid code.'),
    }),
  },
  async (input) => {
    // This tool is a bit different. The AI is good at writing code,
    // so we just need to wrap it in a tool to make it more reliable
    // and to give the AI a clear signal of when to generate code.
    const result = await ai.generate({
      prompt: `Generate Shopify Liquid code for the following request. Return only the raw Liquid code, without any markdown formatting or explanations.

Request: ${input.request}`,
    });

    return { liquidCode: result.text };
  }
);
