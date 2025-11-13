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
    <div className="bg-background">
        {children}
    </div>
  );
}
