import type { TaskLocation } from '../../types/main';
import { normalizeLocation, parseCoordinates } from './location';

export function publicPlaceUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error('Paste a valid public website URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
      !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(url.hostname) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/i.test(url.hostname))
    throw new Error('Use a public website URL without a login or custom port.');
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (/^(?:utm_|igsh|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  return url;
}

export function locationAt(name: string, coordinates: { latitude: number; longitude: number }): TaskLocation {
  return { ...coordinates, name: name.trim() || `Location (${coordinates.latitude}, ${coordinates.longitude})`, address: '', source: 'manual', placeId: 'manual' };
}

// Keep explicit venue/address evidence; social usernames and hashtags are not place names.
export function placeQueries(text: string): string[] {
  const lines = text.replace(/https?:\/\/\S+/gi, '').split(/[\n\r]+/).map((line) => line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^.*?on Instagram:\s*["“]?/i, '')
    .replace(/^.*?\b(?:likes|curtidas).*?:\s*["“]/i, '')
    .replace(/^.*[📍📌]\s*/u, '')
    .replace(/\s*[|–—]\s*(?:Instagram|Facebook|Official.*|Home).*$/i, '')
    .replace(/[@#][\p{L}\p{N}_.]+/gu, '')
    .replace(/^[\s#*>"“📍📌]+|["”\s]+$/gu, '')
    .replace(/^(?:address|endere[çc]o|location|localiza[çc][aã]o|local)\s*:\s*/i, '')
    .trim())
    .filter((line) => line.length >= 3 && !/^(?:Instagram$|Facebook$|Google Maps$|Google Search$|Check this out|Veja isso|Log ?in|Sign up|Access denied|Just a moment|Security check|Cookie|Menu|Navigation|Skip to|Follow us|Share|\d[\d,.]*\s*(?:likes|comments|curtidas))/i.test(line));
  const address = lines.find((line) => /\b(?:rua|avenida|av\.|praça|travessa|estrada|street|road|boulevard)\b|\b\d+\s+.+\b(?:st|rd|ave)\b/i.test(line));
  const name = lines.find((line) => line !== address && !/on Instagram$/i.test(line));
  const queries = [
    lines.slice(0, 3).join(', '),
    [name, address].filter(Boolean).join(', '),
    address || name || '',
  ].map((query) => query.slice(0, 200).trim()).filter((query) => query.length >= 3);
  return [...new Set(queries)].slice(0, 3);
}

export function pastedLocation(input: string): TaskLocation | null {
  const lines = input.trim().split(/[\n\r]+/).map((line) => line.trim()).filter(Boolean);
  const pair = lines.map((line) => parseCoordinates(line)).find(Boolean);
  if (!pair) return null;
  const name = lines.find((line) => !parseCoordinates(line) && !/^https?:/i.test(line)) ?? '';
  return normalizeLocation(locationAt(name, pair));
}
