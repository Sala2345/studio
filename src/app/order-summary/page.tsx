
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';

const SummaryItem = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (!value) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-3">
            <dt className="font-medium text-muted-foreground">{label}</dt>
            <dd className="md:col-span-2 text-foreground">{value}</dd>
        </div>
    );
};

function OrderSummaryPageContent() {
    const searchParams = useSearchParams();

    const inspirationLinks = searchParams.getAll('inspirationLinks');
    
    const summaryData = {
        name: searchParams.get('name'),
        email: searchParams.get('email'),
        phoneNumber: searchParams.get('phoneNumber'),
        address: [
            searchParams.get('streetAddress'),
            searchParams.get('city'),
            searchParams.get('province'),
            searchParams.get('postalCode'),
        ].filter(Boolean).join(', '),
        productTitle: searchParams.get('productTitle'),
        selectedVariantTitle: searchParams.get('selectedVariantTitle'),
        designDescription: searchParams.get('designDescription'),
        contactMode: searchParams.get('contactMode'),
        designStyle: searchParams.get('designStyle')?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        colors: searchParams.get('colors'),
    };

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8 flex items-center justify-center">
            <Card className="w-full max-w-3xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Design Request Summary</CardTitle>
                    <CardDescription className="text-center">
                        Thank you for your submission. Here are the details of your request.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2">Contact Information</h3>
                        <dl className="divide-y divide-border">
                            <SummaryItem label="Name" value={summaryData.name} />
                            <SummaryItem label="Email" value={summaryData.email} />
                            <SummaryItem label="Phone Number" value={summaryData.phoneNumber} />
                            <SummaryItem label="Shipping Address" value={summaryData.address} />
                            <SummaryItem label="Preferred Contact" value={summaryData.contactMode} />
                        </dl>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2">Design Details</h3>
                         <dl className="divide-y divide-border">
                            <SummaryItem label="Product" value={summaryData.productTitle} />
                            <SummaryItem label="Variant" value={summaryData.selectedVariantTitle} />
                            <SummaryItem label="Design Description" value={summaryData.designDescription} />
                            <SummaryItem label="Preferred Style" value={summaryData.designStyle} />
                            <SummaryItem label="Color Palette" value={summaryData.colors} />
                        </dl>
                    </div>

                    {inspirationLinks.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Inspiration Links</h3>
                            <ul className="space-y-2">
                                {inspirationLinks.map((link, index) => (
                                    <li key={index}>
                                        <a 
                                            href={link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="truncate">{link}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderSummaryPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading summary...</div>}>
      <OrderSummaryPageContent />
    </React.Suspense>
  );
}

    