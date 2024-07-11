import '@/src/app/globals.css';

import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { SlideOverProvider } from '@/src/providers/slideover.provider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'maitu',
  description: 'an application to save your goals',
  manifest: '/manifest.json',
  icons: {
    shortcut: '/favicon.ico',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'maitu',
  },
};

export const viewport: Viewport = {
  themeColor: '#3664FF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <SlideOverProvider>{children}</SlideOverProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
