
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

interface DesignRequest {
    id: number;
    timestamp: string;
    name: string;
    email: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    selectedProduct?: { title: string };
    selectedVariantTitle?: string;
    designDescription: string;
    contactMode: string;
    designStyle: string;
    colors: string;
    inspirationLinks: string[];
}

const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (!value) return null;
    return (
        <div className="grid grid-cols-3 gap-2 text-sm">
            <dt className="text-muted-foreground font-medium">{label}</dt>
            <dd className="col-span-2">{value}</dd>
        </div>
    );
};

export default function MyWorksPage() {
    const [requests, setRequests] = useState<DesignRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This code runs only on the client
        try {
            const storedRequests = JSON.parse(localStorage.getItem('designRequests') || '[]');
            // Sort by most recent first
            const sortedRequests = storedRequests.sort((a: DesignRequest, b: DesignRequest) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setRequests(sortedRequests);
        } catch (error) {
            console.error("Failed to parse design requests from localStorage", error);
            setRequests([]);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
             <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <p>Loading your works...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">My Works</CardTitle>
                        <CardDescription>A log of your submitted design requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requests.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {requests.map((req) => (
                                    <AccordionItem key={req.id} value={String(req.id)}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex justify-between items-center w-full pr-4">
                                                <div className="text-left">
                                                    <p className="font-semibold">{req.selectedProduct?.title || 'Custom Request'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Submitted on {format(new Date(req.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-medium">{req.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4 px-4 py-2 border-l-2 border-primary ml-2">
                                                <h4 className="font-semibold">Request Details</h4>
                                                <div className="space-y-2">
                                                    <DetailItem label="Product" value={req.selectedProduct?.title} />
                                                    <DetailItem label="Variant" value={req.selectedVariantTitle} />
                                                    <DetailItem label="Description" value={req.designDescription} />
                                                </div>
                                                
                                                <h4 className="font-semibold pt-2">Contact Info</h4>
                                                 <div className="space-y-2">
                                                    <DetailItem label="Name" value={req.name} />
                                                    <DetailItem label="Email" value={req.email} />
                                                    <DetailItem label="Phone" value={req.phoneNumber} />
                                                    <DetailItem label="Address" value={`${req.streetAddress}, ${req.city}, ${req.province}, ${req.postalCode}`} />
                                                </div>

                                                <h4 className="font-semibold pt-2">Preferences</h4>
                                                <div className="space-y-2">
                                                     <DetailItem label="Contact Method" value={req.contactMode} />
                                                     <DetailItem label="Style" value={req.designStyle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                                                     <DetailItem label="Colors" value={req.colors} />
                                                </div>

                                                {req.inspirationLinks && req.inspirationLinks.length > 0 && (
                                                    <>
                                                        <h4 className="font-semibold pt-2">Inspiration Links</h4>
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            {req.inspirationLinks.map((link, index) => (
                                                                <li key={index}>
                                                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                                                                        {link}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">You haven't submitted any design requests yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    