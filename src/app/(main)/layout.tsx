import type { ReactNode } from 'react';
import { OfflineProvider } from '@/src/components/Offline/OfflineProvider';

export default function MainLayout({ children }: { children: ReactNode }) {
  return <OfflineProvider>{children}</OfflineProvider>;
}
