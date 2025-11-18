
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/25403328/uz37lnr/';
    
    // Data mapping for Zapier, matching the required fields.
    const zapierPayload = {
        customer: {
            first_name: requestData.name.split(' ')[0] || requestData.name,
            last_name: requestData.name.split(' ').slice(1).join(' ') || '',
            email: requestData.email,
            phone: requestData.phoneNumber,
        },
        shipping_address: {
            address1: requestData.streetAddress,
            city: requestData.city,
            province: requestData.province,
            zip: requestData.postalCode,
            country: 'Canada', // Defaulting as requested
            phone: requestData.phoneNumber,
        },
        line_items: [{
            title: requestData.selectedProduct?.title, // Product title
            variant_name: requestData.selectedVariant?.title, // Variant name/title as requested
            quantity: 1, // Defaulting to 1
            price: requestData.selectedProduct?.priceRangeV2.minVariantPrice.amount,
        }],
        note: `Design Request:\n\n${requestData.designDescription}\n\nContact Method: ${requestData.contactMode || 'Email'}\nStyle: ${requestData.designStyle || 'Not specified'}\n\nFiles: ${requestData.uploadedFiles?.length || 0} uploaded\nInspiration Links: ${requestData.inspirationLinks?.filter((l:string) => l).length || 0}`,
        tags: 'design-request,custom-order',
        metafields: {
            design_description: requestData.designDescription,
            contact_method: requestData.contactMode,
            design_style: requestData.designStyle,
            colors: requestData.colors,
            uploaded_files: JSON.stringify(requestData.uploadedFiles.map((f: {url: string}) => f.url)),
            inspiration_links: JSON.stringify(requestData.inspirationLinks),
        }
    };
    
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapierPayload),
    });

    if (!zapierResponse.ok) {
        const errorText = await zapierResponse.text();
        console.error('Zapier webhook failed:', errorText);
        return NextResponse.json({ message: 'Failed to send data to webhook.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Request submitted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/submit-design-request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
