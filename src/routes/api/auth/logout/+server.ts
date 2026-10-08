import { json } from '@sveltejs/kit';
import { headers } from '#lib/session.server';
export async function POST({
  request,
  url,
  cookies,
}: import('./$types').RequestEvent) {
  if (request.headers.get('origin') !== url.origin)
    return json({ error: 'Invalid origin.' }, { status: 403, headers });
  cookies.delete('session', { path: '/' });
  return json({ ok: true }, { headers });
}
