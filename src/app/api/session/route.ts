import { isAuthenticated } from '@/src/lib/session';

export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await isAuthenticated();
  return Response.json(user ? { user } : { error: 'Sign in to sync.' }, {
    status: user ? 200 : 401,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
