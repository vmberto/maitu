import '@/src/app/globals.css';

import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { themeScript } from '@/src/lib/theme';

import { SlideOverProvider } from '@/src/providers/slideover.provider';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="bg-canvas font-sans text-gray-900"
        suppressHydrationWarning
      >
        <SlideOverProvider>{children}</SlideOverProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
