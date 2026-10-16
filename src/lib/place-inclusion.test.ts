import { publicPlaceUrl, placeQueries, pastedLocation } from './place-inclusion';
import { includePlace } from './place-inclusion.server';

const feature = { geometry: { type: 'Point', coordinates: [-34.871, -8.063] }, properties: { name: 'Marco Zero', city: 'Recife', osm_type: 'N', osm_id: 123 } };
const results = () => Response.json({ features: [feature] });

it('reads copied addresses and captions without treating social handles as venue names', () => {
  expect(placeQueries('📍 Marco Zero\nRecife, Brazil\n@travel #recife')[0]).toBe('Marco Zero, Recife, Brazil');
  expect(placeQueries('Cafe do Sol\nRua das Flores 12\nRecife')).toContain('Cafe do Sol, Rua das Flores 12');
  expect(pastedLocation('Marco Zero\n-8.063, -34.871')).toMatchObject({ name: 'Marco Zero', latitude: -8.063, longitude: -34.871 });
  expect(placeQueries('Instagram')).toEqual([]);
  expect(placeQueries('Log in to Instagram')).toEqual([]);
});

it('rejects private, credential-bearing and non-web URLs before any network request', async () => {
  const request = vi.fn();
  for (const url of ['http://127.0.0.1', 'http://[::1]', 'https://user:secret@venue.com', 'http://venue.local', 'http://venue.com:123/private'])
    await expect(includePlace(url, {}, request)).rejects.toThrow();
  for (const url of ['file:///etc/passwd', 'https://localhost', 'http://2130706433'])
    expect(() => publicPlaceUrl(url)).toThrow();
  expect(request).not.toHaveBeenCalled();
  expect(publicPlaceUrl('https://venue.com/visit?utm_source=ig&igsh=tracking&lang=pt#section').href).toBe('https://venue.com/visit?lang=pt');
});

it('resolves explicit coordinates and full map pins without providers', async () => {
  const request = vi.fn();
  expect(await includePlace('-8.063, -34.871', {}, request)).toMatchObject([{ latitude: -8.063, longitude: -34.871 }]);
  expect(await includePlace('https://google.com/maps/search/?query=-8.063,-34.871', {}, request)).toMatchObject([{ latitude: -8.063 }]);
  await expect(includePlace('91, 181', {}, request)).rejects.toThrow('valid latitude');
  expect(request).not.toHaveBeenCalled();
});

it('geocodes text and map queries, deduplicating candidates across partial provider failures', async () => {
  const request = vi.fn().mockResolvedValueOnce(results()).mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(results());
  const places = await includePlace('Marco Zero\nRua do Bom Jesus\nRecife', {}, request);
  expect(places).toHaveLength(1);
  expect(places[0]).toMatchObject({ name: 'Marco Zero', latitude: -8.063, source: 'openstreetmap' });
  expect(request.mock.calls.every(([url]) => String(url).startsWith('https://photon.komoot.io/api/'))).toBe(true);
});

it('reads public Instagram caption evidence through a fixed reader and never fetches the supplied host', async () => {
  const request = vi.fn().mockImplementation(async (url) => String(url).startsWith('https://r.jina.ai/')
    ? Response.json({ data: { title: 'Instagram', content: '📍 Marco Zero, Recife\n@travel #brazil' } }) : results());
  const places = await includePlace('https://www.instagram.com/reel/public-post/?igsh=tracking', { JINA_API_KEY: 'reader-key' }, request);
  expect(places[0]?.name).toBe('Marco Zero');
  expect(request.mock.calls[0][0]).toBe('https://r.jina.ai/https://www.instagram.com/reel/public-post/');
  expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer reader-key');
  expect(new URL(request.mock.calls[1][0]).searchParams.get('q')).toBe('Marco Zero, Recife');
  expect(request.mock.calls[1][1].headers.Authorization).toBeUndefined();
});

it('uses website metadata and shortened Maps destinations rather than generic page titles', async () => {
  const request = vi.fn().mockResolvedValueOnce(Response.json({ data: { title: 'Visit', metadata: { 'og:site_name': 'Sydney Opera House' } } })).mockResolvedValue(results());
  await includePlace('https://www.sydneyoperahouse.com/visit', {}, request);
  expect(new URL(request.mock.calls[1][0]).searchParams.get('q')).toBe('Sydney Opera House');
  const short = vi.fn().mockResolvedValue(Response.json({ data: { url: 'https://google.com/maps/search/?query=-8.063,-34.871' } }));
  expect(await includePlace('https://maps.app.goo.gl/short', {}, short)).toMatchObject([{ latitude: -8.063 }]);
  expect(short).toHaveBeenCalledTimes(1);
});

it('keeps blocked pages, provider failures and oversized responses recoverable', async () => {
  await expect(includePlace('https://instagram.com/p/private', {}, vi.fn().mockResolvedValue(new Response('', { status: 403 })))).rejects.toMatchObject({ status: 422 });
  await expect(includePlace('https://instagram.com/p/private', {}, vi.fn().mockResolvedValue(Response.json({ data: { title: 'Log in to Instagram' } })))).rejects.toMatchObject({ status: 422 });
  await expect(includePlace('Museum Recife', {}, vi.fn().mockResolvedValue(new Response('', { status: 429 })))).rejects.toMatchObject({ status: 503 });
  await expect(includePlace('x'.repeat(4097), {}, vi.fn())).rejects.toMatchObject({ status: 400 });
  await expect(includePlace('https://venue.com', {}, vi.fn().mockResolvedValue(new Response('x'.repeat(256001))))).rejects.toMatchObject({ status: 422 });
});
