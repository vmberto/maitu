'use client';

import { UserInfoSlideOver } from './index';
import { useOffline } from '@/src/components/Offline/OfflineProvider';
export function UserInfoSlideOverWrapper() {
  const { account } = useOffline();
  return account ? <UserInfoSlideOver user={account.user} /> : null;
}
