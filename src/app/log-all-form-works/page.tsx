
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  const router = useRouter();
  const firestore = useFirestore();

  // Memoize the Firestore query to prevent re-renders
  const designRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'designRequests'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: designRequests, isLoading, error } = useCollection<DesignRequest>(designRequestsQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
