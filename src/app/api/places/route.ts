import { isAuthenticated } from '@/src/lib/session';
import { photonPlaces } from '@/src/lib/location';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  if (!(await isAuthenticated()))
    return Response.json(
      { error: 'Sign in to search places.' },
      { status: 401, headers },
    );
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 3 || query.length > 200)
    return Response.json(
      { error: 'Enter a place name and city (3–200 characters).' },
      { status: 400, headers },
    );
  try {
    const url = new URL(
      'api/',
      process.env.PHOTON_URL || 'https://photon.komoot.io/',
    );
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '6');
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'force-cache',
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error('Place search unavailable');
    return Response.json(
      { places: photonPlaces(await response.json()) },
      { headers },
    );
  } catch {
    return Response.json(
      { error: 'Place search is temporarily unavailable. Try again shortly.' },
      { status: 503, headers },
    );
  }
}
