import type { Session, User } from 'lucia';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { getLucia } from '@/src/lib/auth/auth';

export const uncachedValidateRequest = async (): Promise<
  { user: User; session: Session } | { user: null; session: null }
> => {
  const lucia = await getLucia();
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return { user: null, session: null };
  }

  console.log(sessionId);
  console.log(await lucia.validateSession(sessionId));
  return lucia.validateSession(sessionId);
};

export const validateRequest = cache(uncachedValidateRequest);
