
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  key: string;
}

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
    shopifyCustomerId?: string;
    selectedProduct: any;
    selectedVariant?: any;
    designDescription: string;
    contactMode?: string;
    designStyle?: string;
    colors?: string;
    inspirationLinks?: string[];
    uploadedFiles?: UploadedFile[];
}

export default function MyWorksPage() {
    const [requests, setRequests] = useState<DesignRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedRequests = JSON.parse(localStorage.getItem('designRequests') || '[]');
        setRequests(savedRequests.sort((a: DesignRequest, b: DesignRequest) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, []);

    const deleteRequest = (id: number) => {
        if (confirm('Are you sure you want to delete this design request?')) {
            const updatedRequests = requests.filter(req => req.id !== id);
            setRequests(updatedRequests);
            localStorage.setItem('designRequests', JSON.stringify([...updatedRequests].reverse()));
        }
    };

    const viewRequest = (request: DesignRequest) => {
        setSelectedRequest(request);
    };

    const downloadHTML = (request: DesignRequest) => {
        const htmlContent = generateHTML(request);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `design-request-${request.id}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateHTML = (request: DesignRequest) => {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Request - ${request.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; color: #2d2d2d; line-height: 1.6;}
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #ED1C24; border-bottom: 3px solid #ED1C24; padding-bottom: 10px; font-size: 28px; }
        h2 { color: #2d2d2d; margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 8px; font-size: 20px;}
        .info-group { margin: 15px 0; display: flex; flex-wrap: wrap; }
        .label { font-weight: bold; color: #666; display: inline-block; width: 180px; flex-shrink: 0; }
        .value { color: #2d2d2d; }
        .description-value { margin-top: 10px; white-space: pre-wrap; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .timestamp { text-align: right; color: #999; font-size: 14px; margin-top: 30px; }
        .list { list-style: none; padding: 0; }
        .list li { padding: 8px; background: #f9f9f9; margin: 5px 0; border-radius: 4px; word-break: break-all; }
        .list li a { color: #007aff; text-decoration: none; }
        .list li a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Design Request #${request.id}</h1>
        
        <h2>Customer Information</h2>
        <div class="info-group"><span class="label">Name:</span><span class="value">${request.name}</span></div>
        <div class="info-group"><span class="label">Email:</span><span class="value">${request.email}</span></div>
        <div class="info-group"><span class="label">Phone Number:</span><span class="value">${request.phoneNumber}</span></div>
        <div class="info-group"><span class="label">Address:</span><span class="value">${request.streetAddress}, ${request.city}, ${request.province}, ${request.postalCode}</span></div>
        ${request.shopifyCustomerId ? `<div class="info-group"><span class="label">Customer ID:</span><span class="value">${request.shopifyCustomerId}</span></div>` : ''}

        <h2>Product Selection</h2>
        <div class="info-group"><span class="label">Product:</span><span class="value">${request.selectedProduct?.title || 'N/A'}</span></div>
        ${request.selectedVariant ? `<div class="info-group"><span class="label">Variant:</span><span class="value">${request.selectedVariant.title}</span></div>` : ''}

        <h2>Design Details</h2>
        <div class="info-group"><span class="label">Description:</span></div>
        <div class="description-value">${request.designDescription}</div>
        
        ${request.contactMode ? `<div class="info-group"><span class="label">Contact Method:</span><span class="value">${request.contactMode}</span></div>` : ''}
        ${request.designStyle ? `<div class="info-group"><span class="label">Design Style:</span><span class="value">${request.designStyle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>` : ''}
        ${request.colors ? `<div class="info-group"><span class="label">Colors:</span><span class="value">${request.colors}</span></div>` : ''}

        ${request.inspirationLinks && request.inspirationLinks.filter(l=>l).length > 0 ? `
        <h2>Inspiration Links</h2>
        <ul class="list">
            ${request.inspirationLinks.filter(l=>l).map(link => `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`).join('')}
        </ul>
        ` : ''}

        ${request.uploadedFiles && request.uploadedFiles.length > 0 ? `
        <h2>Uploaded Files</h2>
        <ul class="list">
            ${request.uploadedFiles.map(file => `<li><a href="${file.url}" target="_blank" rel="noopener noreferrer">${file.name}</a></li>`).join('')}
        </ul>
        ` : ''}

        <div class="timestamp">
            Submitted on: ${new Date(request.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>
        `;
    };

    if (!isClient) {
         return (
             <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <p>Loading your works...</p>
            </div>
        )
    }

    if (selectedRequest) {
        return (
            <div className="bg-background min-h-screen">
                <div className="max-w-4xl mx-auto p-4 sm:p-6">
                    <Button 
                        onClick={() => setSelectedRequest(null)} 
                        className="mb-6"
                        variant="outline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                    <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: generateHTML(selectedRequest).replace(/<!DOCTYPE html>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '').replace(/<head>[\s\S]*?<\/head>/i, '').replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '') }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-foreground">My Design Requests</h1>
                
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">No design requests found.</p>
                            <p className="text-sm text-muted-foreground/80 mt-2">Submit a request from the 'Hire a Designer' page to see it here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((request) => (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-lg">
                                        <span className="text-foreground">Request #${request.id}</span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {format(new Date(request.timestamp), "MMM d, yyyy")}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Product</p>
                                            <p className="font-medium text-foreground">{request.selectedProduct?.title || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Customer</p>
                                            <p className="font-medium text-foreground">{request.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 border-t pt-4">
                                        <Button 
                                            onClick={() => viewRequest(request)}
                                            variant="default"
                                            size="sm"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Details
                                        </Button>
                                        <Button 
                                            onClick={() => downloadHTML(request)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                        <div className="flex-grow"></div>
                                        <Button 
                                            onClick={() => deleteRequest(request.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
