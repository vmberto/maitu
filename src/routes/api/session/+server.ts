import { json } from '@sveltejs/kit';
import { session, headers } from '#lib/session.server';
export async function GET({ cookies }: import('./$types').RequestEvent) {
  const user = await session(cookies);
  return user
    ? json({ user }, { headers })
    : json({ error: 'Sign in to sync.' }, { status: 401, headers });
}
