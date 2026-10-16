import { photonPlaces, placeInput } from './location';
import { pastedLocation, placeQueries, publicPlaceUrl } from './place-inclusion';

export class PlaceInclusionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readPlaceJson(response: { body: ReadableStream<Uint8Array> | null }, limit = 256_000): Promise<any> {
  if (!response.body) throw new Error('Empty response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '', size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Response too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel(); }
}

export async function includePlace(input: string, env: Record<string, string | undefined> = {}, request = fetch) {
  if (!input.trim() || input.length > 4096) throw new PlaceInclusionError('Paste a place name, address, coordinates, shared text or URL (up to 4,096 characters).');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input.trim()) && !/^https?:/i.test(input.trim())) throw new PlaceInclusionError('Use an HTTP or HTTPS public URL.');
  const direct = pastedLocation(input);
  if (direct) return [direct];
  if (/^[\d.eE+(),;\s−-]+$/.test(input.trim())) throw new PlaceInclusionError('Paste valid latitude and longitude coordinates.');
  let queries: string[] = [];
  const links = input.match(/https?:\/\/[^\s<>"“”]+/gi) ?? [];
  for (const link of links.slice(0, 3)) {
    const url = publicPlaceUrl(link.replace(/[),.;]+$/, ''));
    try {
      const resolved = placeInput(url.href);
      if (resolved.location) return [resolved.location];
      queries.push(resolved.query);
    } catch { /* Opaque links need readable page evidence. */ }
  }
  const directLink = queries.length > 0;
  const textQueries = placeQueries(input);
  if (queries.length) queries = [...queries, ...textQueries];
  else if (textQueries.length) queries = textQueries;
  if (!directLink && links.length) {
    const url = publicPlaceUrl(links[0]!.replace(/[),.;]+$/, ''));
    try {
      // A fixed public reader handles external pages; the app never fetches user-selected hosts.
      const response = await request(`https://r.jina.ai/${url.href}`, {
        headers: { Accept: 'application/json', 'X-Timeout': '15',
          ...(env.JINA_API_KEY ? { Authorization: `Bearer ${env.JINA_API_KEY}` } : {}),
        },
        redirect: 'error', signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('Reader unavailable');
      const body = await readPlaceJson(response);
      const data = body?.data;
      if (!data || typeof data !== 'object') throw new Error('Invalid page data');
      if (typeof data.url === 'string') {
        try {
          const resolved = placeInput(publicPlaceUrl(data.url).href);
          if (resolved.location) return [resolved.location];
          queries.push(resolved.query);
        } catch { /* The final URL may still be opaque. */ }
      }
      const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
      const rawTitle = typeof data.title === 'string' ? data.title : '';
      const title = /^(?:visit|home|contact|about|getting here)$/i.test(rawTitle.trim()) && typeof metadata['og:site_name'] === 'string' ? metadata['og:site_name'].slice(0, 200) : rawTitle.slice(0, 300);
      const content = [metadata['og:description'], data.description, data.content].filter((value) => typeof value === 'string').join('\n').slice(0, 16000);
      // Prefer an actual embedded map link to prose or navigation text.
      for (const link of (content.match(/https?:\/\/[^\s<>"\])]+/gi) ?? []).slice(0, 20)) {
        try {
          const resolved = placeInput(publicPlaceUrl(link).href);
          if (resolved.location) return [resolved.location];
          queries.push(resolved.query);
        } catch { /* Only recognizable place links are useful here. */ }
      }
      const evidence = content.split('\n').filter((line) => /📍|📌|\b(?:address|endere[çc]o|rua|avenida|street|road|boulevard)\b/i.test(line)).slice(0, 4);
      queries = [...placeQueries([title, ...evidence].join('\n')), ...queries];
      if (!queries.length) throw new Error('No venue evidence');
    } catch {
      if (!queries.length) throw new PlaceInclusionError('Could not identify a place from this page. It may require a login. Paste its caption, place name or address instead.', 422);
    }
  }
  queries = [...new Set(queries)].filter(Boolean).slice(0, 3);
  if (!queries.length) throw new PlaceInclusionError('Add the place name or address, including the city if possible.');
  const results = await Promise.allSettled(queries.map(async (query) => {
    const endpoint = new URL('api/', env.PHOTON_URL || 'https://photon.komoot.io/');
    endpoint.searchParams.set('q', query);
    endpoint.searchParams.set('limit', '6');
    const response = await request(endpoint, { headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Search unavailable');
    return photonPlaces(await readPlaceJson(response));
  }));
  const places = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (!results.some((result) => result.status === 'fulfilled'))
    throw new PlaceInclusionError('Place search is unavailable. Try again or paste coordinates.', 503);
  return places.filter((place, index) => places.findIndex((other) => other.placeId === place.placeId && other.source === place.source) === index).slice(0, 6);
}
