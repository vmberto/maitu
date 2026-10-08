import { session, headers } from '#lib/session.server';
import { env } from '$env/dynamic/private';
import { photonPlaces } from '../../../lib/location';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ cookies, url }) => {
  if (!(await session(cookies)))
    return Response.json(
      { error: 'Sign in to search places.' },
      { status: 401, headers },
    );
  const query = url.searchParams.get('q')?.trim() ?? '';
  if (query.length < 3 || query.length > 200)
    return Response.json(
      { error: 'Enter a place name and city (3–200 characters).' },
      { status: 400, headers },
    );
  try {
    const endpoint = new URL(
      'api/',
      env.PHOTON_URL || 'https://photon.komoot.io/',
    );
    endpoint.searchParams.set('q', query);
    endpoint.searchParams.set('limit', '6');
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Search unavailable');
    return Response.json(
      { places: photonPlaces(await response.json()) },
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          'Place search is unavailable. You can paste coordinates instead.',
      },
      { status: 503, headers },
    );
  }
};
