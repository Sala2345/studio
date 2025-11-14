
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
    
  const { customerId, variantId, designRequestId, fileUrls } = input;

  const numericCustomerId = customerId.split('/').pop();
  if (!numericCustomerId) {
    return { success: false, error: 'Invalid Shopify Customer ID format.' };
  }
  
  const customAttributes = [
    { key: "Design Request ID", value: designRequestId },
    ...fileUrls.map((url, index) => ({ key: `Design File ${index + 1}`, value: url })),
  ];
  
  try {
    const result = await createShopifyDraftOrder.run({
      customerId: numericCustomerId,
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
