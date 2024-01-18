import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'maitu',
  description: 'an application to save your goals',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
