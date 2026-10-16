import { GET, POST } from './+server';
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock('../../../lib/session.server', () => ({ session: mocks.session, headers: { 'Cache-Control': 'private, no-store' } }));
function event(input: unknown, method = 'POST') {
  const url = new URL('https://maitu.app/api/places');
  if (method === 'GET' && typeof input === 'string') url.searchParams.set('q', input);
  return { url, cookies: {}, request: new Request(url, { method, ...(method === 'POST' ? { body: JSON.stringify({ input }), headers: { 'Content-Type': 'application/json', Origin: url.origin } } : {}) }) } as any;
}
beforeEach(() => { mocks.session.mockResolvedValue({ _id: 'user' }); });
afterEach(() => { vi.unstubAllGlobals(); });
it('requires a session and validates body, origin and input size', async () => {
  mocks.session.mockResolvedValueOnce(null);
  expect((await POST(event('Museum'))).status).toBe(401);
  expect((await POST(event({ url: 'Museum' }))).status).toBe(400);
  expect((await POST(event('x'.repeat(4097)))).status).toBe(400);
  const foreign = event('Museum');
  foreign.request.headers.set('origin', 'https://foreign.test');
  expect((await POST(foreign)).status).toBe(403);
});
it('supports private POST inputs and legacy searches without caching responses', async () => {
  for (const method of ['GET', 'POST']) {
    const response = await (method === 'POST' ? POST : GET)(event('Marco Zero\n-8.063, -34.871', method));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect((await response.json()).places[0]).toMatchObject({ name: 'Marco Zero', latitude: -8.063 });
  }
});
it('reads provider configuration from Cloudflare bindings and keeps reader credentials private', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ features: [] }));
  vi.stubGlobal('fetch', fetcher);
  const request = event('Museum Recife', 'GET');
  request.platform = { env: { PHOTON_URL: 'https://geo.maitu.app/', JINA_API_KEY: 'private-key' } };
  const response = await GET(request);
  expect(fetcher.mock.calls[0][0].origin).toBe('https://geo.maitu.app');
  expect(JSON.stringify(await response.json())).not.toContain('private-key');
});


it('researches a place through the Worker AI binding and returns tags with a sourced pin', async () => {
  const run = vi.fn().mockResolvedValue({ response: { resolution: 'resolved', name: 'Museum', address: 'Rua Example 1', city: 'Recife', source: 'search', tags: [{ name: 'Museum', evidence: 'Museum exhibits', source: 'search' }] } });
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: { title: 'Museum', content: 'Museum exhibits. Rua Example 1, Recife. [Map](https://google.com/maps/search/?query=-8.063,-34.871)' } }));
  vi.stubGlobal('fetch', fetcher);
  const request = event('Museum Recife');
  request.platform = { env: { AI: { run }, OPENAI_API_KEY: 'unused-private-key' } };
  const response = await POST(request);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.autoAdd).toBe(true);
  expect(body.places[0]).toMatchObject({ name: 'Museum', tags: ['Museum'], latitude: -8.063 });
  expect(JSON.stringify(body)).not.toContain('unused-private-key');
  expect(run).toHaveBeenCalledTimes(1);
  expect(String(fetcher.mock.calls[0][0])).toContain('r.jina.ai/https://duckduckgo.com/');
});
