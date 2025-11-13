import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'AI Designer',
  description: 'Generate designs with AI.',
};

export default function DesignerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        {children}
      </body>
    </html>
  );
}
