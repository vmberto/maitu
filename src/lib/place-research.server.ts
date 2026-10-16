import { parseCoordinates, placeInput } from './location';
import { placeQueries, publicPlaceUrl } from './place-inclusion';
import { PlaceInclusionError, readPlaceJson } from './place-inclusion.server';
import { logger } from './logger';

export type PlacePage = { id: string; url: string; title: string; text: string; links: string[] };
export function folded(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export function contains(text: string, value: string): boolean {
  return !!folded(value) && ` ${folded(text)} `.includes(` ${folded(value)} `);
}
export function containsAddress(text: string, value: string): boolean {
  const expand = (part: string) => folded(part).replace(/\bav\b/g, 'avenida').replace(/\bdr\b/g, 'doutor').replace(/\bn\s+(?=\d)/g, '');
  return contains(expand(text), expand(value));
}
export function nameTerms(query: string): string[] {
  return folded(query).split(' ').filter((word) => word.length > 2 && !['restaurant', 'restaurante', 'bistro', 'bistrot', 'cafe', 'coffee', 'the', 'and', 'com', 'www', 'https'].includes(word));
}

function webFailure(reference: string): PlaceInclusionError {
  const reason = reference.startsWith('WEB-HTTP-429') ? 'The public reader rate limit was reached. Set the Worker secret JINA_API_KEY to use your own Jina account allowance, or try later.'
    : reference.startsWith('WEB-HTTP-401') ? 'The public reader rejected its API key. Check the Worker secret JINA_API_KEY.'
    : reference.startsWith('WEB-HTTP-403') ? 'The public page reader blocked this research request.'
    : reference === 'WEB-TIMEOUT' ? 'The public page reader timed out. Try the lookup again.'
    : reference.startsWith('WEB-TARGET-') ? 'The source website blocked the public reader or returned an error.'
    : reference === 'WEB-RESPONSE' ? 'The public page reader returned an unreadable response.'
    : 'The public page reader could not complete this research request.';
  logger.warn({ event: 'place_research_failure', reference }, 'Public place research failed');
  return new PlaceInclusionError(`${reason} (${reference})`, 503);
}

async function readPage(url: string, id: string, request: typeof fetch, signal: AbortSignal, apiKey?: string): Promise<PlacePage> {
  const target = publicPlaceUrl(url).href;
  try {
    const response = await request(`https://r.jina.ai/${target}`, {
      headers: { Accept: 'application/json', 'X-Timeout': '15', 'X-With-Links-Summary': 'all', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      redirect: 'manual', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) {
      const failure = await readPlaceJson(response, 16000).catch(() => null);
      const code = String(failure?.code ?? '').match(/^\d{3,6}$/)?.[0];
      throw webFailure(`WEB-HTTP-${response.status}${code ? `-${code}` : ''}`);
    }
    const data = (await readPlaceJson(response).catch(() => { throw webFailure('WEB-RESPONSE'); }))?.data;
    if (!data || typeof data.content !== 'string') throw webFailure('WEB-RESPONSE');
    if (typeof data.httpStatus === 'number' && data.httpStatus >= 400) throw webFailure(`WEB-TARGET-${data.httpStatus}`);
    const title = typeof data.title === 'string' ? data.title.slice(0, 250) : 'Place source';
    const text = [title, data.description, data.content].filter((part) => typeof part === 'string').join('\n').replace(/\*{4}/g, ' ').replace(/\*\*/g, '').slice(0, 16000);
    const rawLinks = [...(data.content.match(/https?:\/\/[^\s<>"\])]+/gi) ?? []),
      ...(Array.isArray(data.links) ? data.links.flatMap((link: unknown) => Array.isArray(link) && typeof link[1] === 'string' ? [link[1]] : []) : [])];
    const links: string[] = [];
    for (const raw of rawLinks.slice(0, 250)) {
      try { const safe = publicPlaceUrl(raw).href; if (!links.includes(safe)) links.push(safe); } catch { /* Ignore private and non-web links. */ }
    }
    return { id, url: typeof data.url === 'string' ? publicPlaceUrl(data.url).href : target, title, text, links };
  } catch (cause) {
    if (cause instanceof PlaceInclusionError) throw cause;
    const name = cause instanceof Error ? cause.name : '';
    throw webFailure(signal.aborted || name === 'TimeoutError' || name === 'AbortError' ? 'WEB-TIMEOUT' : 'WEB-CONNECTION');
  }
}

export async function researchPlace(input: string, request = fetch, env: Record<string, string | undefined> = {}): Promise<{ pages: PlacePage[]; query: string }> {
  const links = (input.match(/https?:\/\/[^\s<>"“”]+/gi) ?? []).map((link) => publicPlaceUrl(link.replace(/[),.;]+$/, '')).href);
  const text = input.replace(/https?:\/\/\S+/gi, '').trim();
  const signal = AbortSignal.timeout(35000);
  const pages: PlacePage[] = [];
  let query = '';
  for (const link of links.slice(0, 3)) {
    try { query = placeInput(link).query; break; } catch { /* A post needs page content. */ }
  }
  if (!query && links.length) {
    try {
      const page = await readPage(links[0], 'page', request, signal, env.JINA_API_KEY);
      pages.push(page);
      try {
        const parsed = placeInput(page.url);
        if (parsed.location) return { pages, query: parsed.query };
      } catch { /* A venue page may still need a research search. */ }
      query = placeQueries([page.title, text].join('\n'))[0] || '';
    } catch (cause) {
      if (!text) throw cause;
    }
  }
  query = (query || placeQueries(text)[0] || '').slice(0, 300);
  if (!query) throw new PlaceInclusionError('Paste a place name, caption or a readable public link.', 422);
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  let searchFailure: unknown;
  try {
    const search = await readPage(searchUrl, 'search', request, signal, env.JINA_API_KEY);
    pages.push(search);
    const terms = nameTerms(query);
    const targets = search.links.filter((link) => {
      const url = new URL(link);
      return !/(^|\.)(duckduckgo\.com|google\.com|bing\.com|apple\.com|microsoft\.com)$/.test(url.hostname)
        && !/\.(?:png|jpe?g|svg|webp|gif|ico|pdf)(?:\?|$)/i.test(link);
    }).map((url) => ({ url, score: terms.filter((term) => folded(decodeURI(url)).includes(term)).length }))
      .filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
    const followed = await Promise.allSettled(targets.map((item, i) => readPage(item.url, `source${i + 1}`, request, signal, env.JINA_API_KEY)));
    for (const result of followed) if (result.status === 'fulfilled') pages.push(result.value);
  } catch (cause) { searchFailure = cause; /* A readable shared venue page can stand on its own. */ }
  if (!pages.length) throw searchFailure instanceof PlaceInclusionError ? searchFailure : webFailure('WEB-CONNECTION');
  return { pages: pages.filter((page, index) => pages.findIndex((other) => other.url === page.url) === index), query };
}

// Accept only explicit venue pins, never map-camera centers or model-generated numbers.
export function pagePins(page: PlacePage): { latitude: number; longitude: number }[] {
  const pins: { latitude: number; longitude: number }[] = [];
  for (const link of [page.url, ...page.links]) {
    try {
      const point = placeInput(link).location;
      if (point) pins.push({ latitude: point.latitude, longitude: point.longitude });
    } catch { /* Most source links do not encode a map pin. */ }
    try {
      const url = new URL(link);
      if (url.hostname !== 'external-content.duckduckgo.com' || url.pathname !== '/ssv2/') continue;
      const markers = JSON.parse(url.searchParams.get('annotations') || '[]');
      if (!Array.isArray(markers)) continue;
      for (const marker of markers.slice(0, 5)) {
        const point = typeof marker?.point === 'string' ? parseCoordinates(marker.point) : null;
        if (point) pins.push(point);
      }
    } catch { /* Malformed map data is not usable evidence. */ }
  }
  return pins.filter((pin, index) => pins.findIndex((other) => Math.abs(other.latitude - pin.latitude) < 0.00001 && Math.abs(other.longitude - pin.longitude) < 0.00001) === index);
}
