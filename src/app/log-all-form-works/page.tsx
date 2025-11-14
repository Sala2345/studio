
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ExternalLink, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Define the structure of a design request document
interface DesignRequest {
  id: string;
  name: string;
  email: string;
  productTitle: string;
  selectedVariantTitle: string;
  createdAt: {
    toDate: () => Date;
  };
  contactMode: string;
  fileUrls?: string[];
}

function LogAllFormWorksPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Memoize the Firestore query to prevent re-renders
  const designRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'designRequests'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: designRequests, isLoading: isDataLoading, error } = useCollection<DesignRequest>(designRequestsQuery);

  const isLoading = isUserLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not authenticated, show an access denied message
  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You must be logged in to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/login')}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Go to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>Design Request Logs</CardTitle>
          <CardDescription>A real-time log of all submitted design requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Contact Mode</TableHead>
                  <TableHead>File Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designRequests && designRequests.length > 0 ? (
                  designRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.name}</div>
                        <div className="text-sm text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{req.productTitle}</div>
                        {req.selectedVariantTitle && <div className="text-sm text-muted-foreground">{req.selectedVariantTitle}</div>}
                      </TableCell>
                      <TableCell>
                        {req.createdAt ? format(req.createdAt.toDate(), 'PPpp') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{req.contactMode}</Badge>
                      </TableCell>
                      <TableCell>
                        {req.fileUrls && req.fileUrls.length > 0 ? (
                          <div className="flex flex-col space-y-1">
                            {req.fileUrls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                File {index + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No design requests submitted yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LogAllFormWorksPage;

