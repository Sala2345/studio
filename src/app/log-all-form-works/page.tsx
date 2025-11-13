
'use client';

import React, { useMemo } from 'react';
import { useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, where, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DesignRequest {
  id: string;
  customerName: string;
  productTitle: string;
  designDescription: string;
  fileUrls: string[];
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
  // Add other fields from your design request document as needed
}

function LogAllFormWorksPage() {
  const firestore = useFirestore() as Firestore;
  const { user, isUserLoading } = useUser();

  const designRequestsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collectionGroup(firestore, 'designRequests'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [firestore]
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Design Request Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading logs...</p>
            ) : designRequests && designRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Files</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.createdAt
                          ? format(
                              new Date(request.createdAt.seconds * 1000),
                              'MMM dd, yyyy, h:mm a'
                            )
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{request.customerName || 'N/A'}</TableCell>
                      <TableCell>{request.productTitle || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.designDescription}</TableCell>
                      <TableCell className="text-center">
                        {request.fileUrls && request.fileUrls.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {request.fileUrls.map((url, index) => (
                                    <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs truncate"
                                    >
                                        File {index + 1}
                                    </a>
                                ))}
                            </div>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No design requests found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LogAllFormWorksPage;

