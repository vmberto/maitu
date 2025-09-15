'use server';

import { getSession } from '@/src/actions/auth.action';
import { UserInfoSlideOver } from '@/src/app/(main)/components/UserInfoSlideOver';

export async function UserInfoSlideOverWrapper() {
  const user = await getSession();

  return <UserInfoSlideOver user={user} />;
}
