'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createShopifyDraftOrder } from './shopify-tools';

const DraftOrderInputSchema = z.object({
    designRequestId: z.string(),
    customerId: z.string().describe("The user's Firebase UID, which should correspond to a Shopify customer."),
    // This assumes we have a mapping from a product ID in our form to a Shopify variant ID
    variantId: z.string().describe("The Shopify GID of the product variant to order."), 
    fileUrls: z.array(z.string()).describe("Array of URLs to the uploaded design files in Firebase Storage."),
});

export type DraftOrderInput = z.infer<typeof DraftOrderInputSchema>;

const DraftOrderOutputSchema = z.object({
  success: z.boolean(),
  orderId: z.string().optional(),
  invoiceUrl: z.string().optional(),
  error: z.string().optional(),
});

export type DraftOrderOutput = z.infer<typeof DraftOrderOutputSchema>;

export async function createDraftOrderFlow(input: DraftOrderInput): Promise<DraftOrderOutput> {
    
  // Here, you might need a step to map your internal customerId (Firebase UID)
  // to a Shopify Customer ID. For now, we'll assume they might be the same or you have a lookup mechanism.
  // We also need to map our product selection to a specific variant ID.

  const { customerId, variantId, designRequestId, fileUrls } = input;

  const customAttributes = [
    { key: "Design Request ID", value: designRequestId },
    ...fileUrls.map((url, index) => ({ key: `Design File ${index + 1}`, value: url })),
  ];
  
  try {
    const result = await createShopifyDraftOrder.run({
      customerId: customerId, // This might need to be looked up
      variantId: variantId,
      customAttributes: customAttributes,
    });

    if (result.draftOrderCreate?.draftOrder) {
      return {
        success: true,
        orderId: result.draftOrderCreate.draftOrder.id,
        invoiceUrl: result.draftOrderCreate.draftOrder.invoiceUrl,
      };
    } else {
       const errors = result.draftOrderCreate?.userErrors.map((e: any) => e.message).join(', ');
       console.error("Shopify draft order creation failed:", errors);
       return { success: false, error: errors || 'Failed to create draft order in Shopify.' };
    }
  } catch (error: any) {
    console.error("Error in createDraftOrderFlow:", error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
