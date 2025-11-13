
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findCustomerByEmail, createDraftOrder } from '@/services/shopify';

const LogEntrySchema = z.object({
  id: z.string(),
  customerName: z.string(),
  email: z.string(),
  phoneNumber: z.string().optional(),
  productTitle: z.string(),
  productId: z.string(),
  selectedVariantId: z.string(),
  selectedVariantTitle: z.string().optional(),
  designDescription: z.string(),
  contactMode: z.string(),
  designStyle: z.string().optional(),
  colors: z.string().optional(),
  fileUrls: z.array(z.string()).optional(),
  inspirationLinks: z.array(z.string()).optional(),
  createdAt: z.any().optional(),
});


const CreateOrderInputSchema = z.object({
    log: LogEntrySchema
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

const CreateOrderOutputSchema = z.object({
  success: z.boolean(),
  orderId: z.string().optional(),
  invoiceUrl: z.string().optional(),
  error: z.string().optional(),
});

export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;

function formatNote(log: z.infer<typeof LogEntrySchema>): string {
    let note = `Design Request Details (ID: ${log.id})\n`;
    note += `-------------------------------------------\n`;
    note += `Customer: ${log.customerName} (${log.email})\n`;
    if (log.phoneNumber) note += `Phone: ${log.phoneNumber}\n`;
    note += `\n`;
    note += `Product: ${log.productTitle}\n`;
    if (log.selectedVariantTitle) note += `Variant: ${log.selectedVariantTitle}\n`;
    note += `\n`;
    note += `Design Description:\n${log.designDescription}\n`;
    note += `\n`;
    note += `Contact Preference: ${log.contactMode}\n`;
    if (log.designStyle) note += `Preferred Style: ${log.designStyle}\n`;
    if (log.colors) note += `Color Preferences: ${log.colors}\n`;
    note += `\n`;
    if (log.inspirationLinks && log.inspirationLinks.length > 0) {
        note += `Inspiration Links:\n${log.inspirationLinks.join('\n')}\n\n`;
    }
    if (log.fileUrls && log.fileUrls.length > 0) {
        note += `Uploaded Files:\n${log.fileUrls.join('\n')}\n\n`;
    }
    note += `-------------------------------------------\n`;
    return note;
}


export const createOrderFromLogFlow = ai.defineFlow(
  {
    name: 'createOrderFromLogFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async ({ log }) => {
    try {
        // 1. Find the Shopify customer by email
        const customer = await findCustomerByEmail(log.email);
        if (!customer) {
            return { success: false, error: `Customer with email ${log.email} not found in Shopify.` };
        }
        const customerId = customer.id.split('/').pop();
         if (!customerId) {
            return { success: false, error: 'Could not extract numeric ID from Shopify customer GID.' };
        }

        // 2. Format the note
        const note = formatNote(log);

        // 3. Prepare custom attributes
        const customAttributes = [
            { key: "Design Request ID", value: log.id },
            ...(log.fileUrls || []).map((url, index) => ({ key: `Design File ${index + 1}`, value: url })),
        ];

        // 4. Create the draft order
        const result = await createDraftOrder(customerId, log.selectedVariantId, customAttributes, note);

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
        console.error("Error in createOrderFromLogFlow:", error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
  }
);
