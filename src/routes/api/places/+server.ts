import { session, headers } from '#lib/session.server';
import { includePlace, PlaceInclusionError, readPlaceJson } from '../../../lib/place-inclusion.server';
import { smartPlace, type PlaceAI } from '../../../lib/smart-place.server';
import type { RequestHandler } from './$types';

const resolve: RequestHandler = async (event) => {
  if (!(await session(event.cookies)))
    return Response.json({ error: 'Sign in to search places.' }, { status: 401, headers });
  try {
    if (event.request.method === 'POST') {
      const origin = event.request.headers.get('origin');
      if (origin && origin !== event.url.origin) return Response.json({ error: 'Invalid origin.' }, { status: 403, headers });
      if (Number(event.request.headers.get('content-length')) > 24_000) throw new PlaceInclusionError('Place info is too long.');
    }
    const input = event.request.method === 'POST'
      ? (await readPlaceJson(event.request, 24_000).catch(() => null))?.input
      : event.url.searchParams.get('q');
    if (typeof input !== 'string') throw new PlaceInclusionError('Paste some place info first.');
    const bindings = (event.platform as { env?: Record<string, string> & { AI?: PlaceAI } } | undefined)?.env;
    const env = { ...process.env, ...bindings };
    return Response.json(event.request.method === 'POST' ? await smartPlace(input, env, fetch, bindings?.AI) : { places: await includePlace(input, env) }, { headers });
  } catch (cause) {
    return Response.json({ error: cause instanceof PlaceInclusionError ? cause.message : 'Could not find this place. Try its name and city or coordinates.' },
      { status: cause instanceof PlaceInclusionError ? cause.status : 400, headers });
  }
};
export const GET = resolve;
export const POST = resolve;
