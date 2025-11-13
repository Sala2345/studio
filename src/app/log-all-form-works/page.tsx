
'use client';

import React, { useState } from 'react';
import { useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, where, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

interface DesignRequest {
  id: string;
  customerName: string;
  email: string;
  phoneNumber?: string;
  shippingAddress?: string;
  productId: string;
  productTitle: string;
  selectedVariantId: string;
  selectedVariantTitle?: string;
  designDescription: string;
  contactMode: string;
  designStyle?: string;
  colors?: string;
  fileUrls: string[];
  inspirationLinks: string[];
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

function LogAllFormWorksPage() {
  const firestore = useFirestore() as Firestore;
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const designRequestsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collectionGroup(firestore, 'designRequests'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [firestore, user]
  );

  const { data: designRequests, isLoading: isLoadingRequests } = useCollection<DesignRequest>(designRequestsQuery);

  const isLoading = isUserLoading || isLoadingRequests;


  if (!isUserLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">Please log in to view the design request logs.</p>
            {/* You can add a login button here */}
             <Link href="/api/auth/login">
                <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Design Request Logs</CardTitle>
            <CardDescription>A log of all submitted design requests from the "Hire a Designer" form.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Loading design logs...</p>
              </div>
            ) : designRequests && designRequests.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date Submitted</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[120px]">Description</TableHead>
                    <TableHead className="text-center w-[100px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.createdAt
                          ? format(
                              new Date(request.createdAt.seconds * 1000),
                              'MMM dd, yyyy, h:mm a'
                            )
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                          <div className="font-medium">{request.customerName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                          {request.phoneNumber && <div className="text-sm text-muted-foreground">{request.phoneNumber}</div>}
                      </TableCell>
                      <TableCell>
                          <div>{request.productTitle || 'N/A'}</div>
                          {request.selectedVariantTitle && (
                              <div className="text-sm text-muted-foreground font-medium">{request.selectedVariantTitle}</div>
                          )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{request.designDescription}</TableCell>
                      <TableCell className="text-center">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger>
                                     <Button size="sm" variant="outline">View All</Button>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-gray-50 rounded-md mt-2 text-left absolute z-10 min-w-[300px] shadow-lg border">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold">Contact</h4>
                                            <p>Mode: <Badge variant="secondary">{request.contactMode}</Badge></p>
                                            {request.phoneNumber && <p>Phone: {request.phoneNumber}</p>}
                                            {request.shippingAddress && <p>Address: {request.shippingAddress}</p>}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Design Preferences</h4>
                                            {request.designStyle && <p>Style: <span className="capitalize">{request.designStyle.replace(/-/g, ' ')}</span></p>}
                                            {request.colors && <p>Colors: {request.colors}</p>}
                                        </div>
                                        {request.inspirationLinks && request.inspirationLinks.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">Inspiration Links</h4>
                                                <ul className="list-disc list-inside">
                                                    {request.inspirationLinks.map((link, index) => link && <li key={index}><a href={link} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Link {index+1}</a></li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {request.fileUrls && request.fileUrls.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">Uploaded Files</h4>
                                                <ul className="list-disc list-inside">
                                                    {request.fileUrls.map((url, index) => <li key={index}><a href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">File {index+1}</a></li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No design requests have been submitted yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LogAllFormWorksPage;
