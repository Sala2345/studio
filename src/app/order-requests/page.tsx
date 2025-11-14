
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, File, ExternalLink, Palette, PenSquare, MessageCircle, Info, User, Phone, Mail, Home } from 'lucide-react';
import Image from 'next/image';

function OrderRequestsPageContent() {
    const searchParams = useSearchParams();

    const requestData = {
        name: searchParams.get('name') || 'N/A',
        email: searchParams.get('email') || 'N/A',
        phoneNumber: searchParams.get('phoneNumber') || 'N/A',
        shippingAddress: searchParams.get('shippingAddress') || 'N/A',
        product: searchParams.get('product') || 'N/A',
        variant: searchParams.get('variant') || 'N/A',
        description: searchParams.get('description') || 'N/A',
        contactMode: searchParams.get('contactMode') || 'N/A',
        style: searchParams.get('style')?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
        colors: searchParams.get('colors') || 'N/A',
        files: Array.from(searchParams.entries()).filter(([key]) => key.startsWith('fileUrl')).map(([, value]) => value),
        inspirationLinks: Array.from(searchParams.entries()).filter(([key]) => key.startsWith('inspirationLink')).map(([, value]) => value),
    };

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
        <div>
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Icon className="w-4 h-4 mr-2" />
                {label}
            </h3>
            <p className="text-base text-foreground mt-1">{value || 'Not provided'}</p>
        </div>
    );

    return (
        <div className="bg-background font-sans">
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <Card className="shadow-lg">
                    <CardHeader className="bg-muted/30 p-6">
                         <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground">Design Request Submitted</CardTitle>
                                <CardDescription className="text-muted-foreground mt-1">
                                    Thank you, {requestData.name}! Our team will contact you shortly via {requestData.contactMode}.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                <User className="w-5 h-5 mr-3 text-primary" />
                                Customer Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-background">
                                <DetailItem icon={User} label="Full Name" value={requestData.name} />
                                <DetailItem icon={Mail} label="Email Address" value={requestData.email} />
                                <DetailItem icon={Phone} label="Phone Number" value={requestData.phoneNumber} />
                                <DetailItem icon={Home} label="Shipping Address" value={requestData.shippingAddress} />
                            </div>
                        </div>
                        
                        <Separator />

                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                <Info className="w-5 h-5 mr-3 text-primary" />
                                Design Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-background">
                                <DetailItem icon={Info} label="Product" value={`${requestData.product} (${requestData.variant})`} />
                                <DetailItem icon={MessageCircle} label="Contact Preference" value={requestData.contactMode} />
                                <DetailItem icon={PenSquare} label="Design Style" value={requestData.style} />
                                <DetailItem icon={Palette} label="Color Preferences" value={requestData.colors} />
                                <div className="md:col-span-2">
                                     <DetailItem icon={Info} label="Design Description" value={<span className="whitespace-pre-wrap">{requestData.description}</span>} />
                                </div>
                            </div>
                        </div>

                        {requestData.files.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                        <File className="w-5 h-5 mr-3 text-primary" />
                                        Uploaded Files
                                    </h2>
                                    <ul className="space-y-3 p-4 border rounded-lg bg-background">
                                        {requestData.files.map((file, index) => (
                                            <li key={index} className="flex items-center">
                                                <a href={file} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-sm">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    {file.split('/').pop()?.split('?')[0] || `File ${index + 1}`}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                        
                        {requestData.inspirationLinks.length > 0 && (
                             <>
                                <Separator />
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                        <ExternalLink className="w-5 h-5 mr-3 text-primary" />
                                        Inspiration Links
                                    </h2>
                                     <ul className="space-y-3 p-4 border rounded-lg bg-background">
                                        {requestData.inspirationLinks.map((link, index) => (
                                            <li key={index} className="flex items-center">
                                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate">
                                                     <ExternalLink className="w-4 h-4 mr-2" />
                                                    {link}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function OrderRequestsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <OrderRequestsPageContent />
        </React.Suspense>
    );
}

