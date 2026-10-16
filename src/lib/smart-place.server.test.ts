import { smartPlace } from './smart-place.server';

const extracted = { name: 'Terraço da Praça', address: '', city: 'Recife' };
const input = 'https://www.google.com/search?q=terraco+da+praca+recife&sourceid=chrome';
const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [-34.871, -8.063] }, properties: { name: 'Terraço da Praça', city: 'Recife', country: 'Brazil', osm_type: 'N', osm_id: 123 } };
const engine = (fields: unknown = extracted) => ({ run: vi.fn().mockResolvedValue({ response: fields }) });
const geocoder = (features = [feature]) => vi.fn().mockResolvedValue(Response.json({ features }));
afterEach(() => { vi.useRealTimers(); });

it('extracts supplied venue text with Llama and takes coordinates only from OpenStreetMap', async () => {
  const ai = engine({ ...extracted, latitude: 50, longitude: 50 });
  const request = geocoder();
  const result = await smartPlace(input, {}, request, ai);
  expect(ai.run).toHaveBeenCalledTimes(1);
  expect(ai.run.mock.calls[0]).toMatchObject(['@cf/meta/llama-3.1-8b-instruct-fp8', { max_tokens: 400, temperature: 0, response_format: { type: 'json_object' } }]);
  expect(ai.run.mock.calls[0][1].response_format).not.toHaveProperty('json_schema');
  expect(ai.run.mock.calls[0][1].messages[1].content).toContain('terraco da praca recife');
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0].hostname).toBe('photon.komoot.io');
  expect(request.mock.calls[0][0].searchParams.get('q')).toBe('Terraço da Praça, Recife');
  expect(result).toMatchObject({ autoAdd: true, places: [{ latitude: -8.063, longitude: -34.871, source: 'openstreetmap', placeId: 'N123' }] });
  expect(result.sources).toContainEqual({ url: 'https://www.openstreetmap.org/node/123', title: 'OpenStreetMap: Terraço da Praça' });
});

it('bypasses AI and external requests for pasted coordinates and full map pins', async () => {
  const request = vi.fn();
  expect(await smartPlace('Marco Zero\n-8.063, -34.871', {}, request)).toMatchObject({ autoAdd: true, places: [{ name: 'Marco Zero', latitude: -8.063 }] });
  expect(await smartPlace('https://google.com/maps/search/?query=-8.063,-34.871', {}, request)).toMatchObject({ autoAdd: true, places: [{ latitude: -8.063 }] });
  expect(request).not.toHaveBeenCalled();
});

it('requires the AI binding and never falls back to an OpenAI key', async () => {
  const request = vi.fn();
  await expect(smartPlace(input, { OPENAI_API_KEY: 'unused-private-key' }, request)).rejects.toThrow('binding named AI');
  expect(request).not.toHaveBeenCalled();
});

it('reads public page text through a fixed reader without paid reader credentials', async () => {
  const ai = engine();
  const request = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: { title: 'Terraço da Praça', content: 'Visit us in Recife.' } }))
    .mockResolvedValueOnce(Response.json({ features: [feature] }));
  const result = await smartPlace('https://www.instagram.com/reel/public-post/?igsh=tracking', { JINA_API_KEY: 'unused-secret' }, request, ai);
  expect(request.mock.calls[0][0]).toBe('https://r.jina.ai/https://www.instagram.com/reel/public-post/');
  expect(request.mock.calls[0][1]).toMatchObject({ redirect: 'manual', headers: { Accept: 'application/json' } });
  expect(request.mock.calls[0][1].headers.Authorization).toBeUndefined();
  expect(ai.run.mock.calls[0][1].messages[1].content).toContain('Visit us in Recife.');
  expect(result.autoAdd).toBe(true);
  expect(result.sources[0].url).toBe('https://www.instagram.com/reel/public-post/');
});

it('resolves short map URLs from reader evidence without asking the model', async () => {
  const ai = engine();
  const request = vi.fn().mockResolvedValue(Response.json({ data: { url: 'https://google.com/maps/search/?query=-8.063,-34.871' } }));
  expect(await smartPlace('https://maps.app.goo.gl/short', {}, request, ai)).toMatchObject({ autoAdd: true, places: [{ latitude: -8.063 }] });
  expect(ai.run).not.toHaveBeenCalled();
});

it('requires review for multiple matches, missing city, different names or different cities', async () => {
  const scenarios = [
    { ai: extracted, features: [feature, { ...feature, properties: { ...feature.properties, osm_id: 124 } }] },
    { ai: { ...extracted, city: '' }, features: [feature] },
    { ai: extracted, features: [{ ...feature, properties: { ...feature.properties, name: 'Praça' } }] },
    { ai: extracted, features: [{ ...feature, properties: { ...feature.properties, city: 'Olinda' } }] },
  ];
  for (const scenario of scenarios) {
    const result = await smartPlace(input, {}, geocoder(scenario.features), engine(scenario.ai));
    expect(result.autoAdd).toBe(false);
    expect(result.places.length).toBeGreaterThan(0);
    expect(result.message).toContain('Review');
  }
});

it('rejects invented names, cities, addresses and malformed model responses before geocoding', async () => {
  for (const fields of [{ ...extracted, city: 'Lisbon' }, { ...extracted, name: 'Another place' }, { ...extracted, address: 'Rua invented 12' }, { ...extracted, city: null }, { ...extracted, name: 'x'.repeat(301) }, null]) {
    const request = vi.fn();
    await expect(smartPlace(input, {}, request, engine(fields))).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  }
});

it('keeps missing venues and empty or invalid geocoder results from creating tasks', async () => {
  const request = vi.fn();
  expect(await smartPlace('Just a caption', {}, request, engine({ name: '', address: '', city: '' }))).toMatchObject({ autoAdd: false, places: [] });
  expect(request).not.toHaveBeenCalled();
  expect(await smartPlace(input, {}, geocoder([]), engine())).toMatchObject({ autoAdd: false, places: [] });
  expect(await smartPlace(input, {}, geocoder([{ ...feature, geometry: { type: 'Point', coordinates: [181, 91] } }]), engine())).toMatchObject({ autoAdd: false, places: [] });
});

it('handles inaccessible pages, malformed readers, redirects and failed AI or geocoding without leaking details', async () => {
  for (const response of [new Response('', { status: 403 }), new Response('', { status: 302 }), Response.json({}), new Response('x'.repeat(256001))]) {
    const ai = engine();
    await expect(smartPlace('https://instagram.com/p/private', {}, vi.fn().mockResolvedValue(response), ai)).rejects.toMatchObject({ status: 422 });
    expect(ai.run).not.toHaveBeenCalled();
  }
  const request = geocoder();
  await expect(smartPlace(input, {}, request, { run: vi.fn().mockRejectedValue(new Error('private-provider-detail')) })).rejects.toThrow('Cloudflare AI could not finish');
  expect(request).not.toHaveBeenCalled();
  await expect(smartPlace(input, {}, request, { run: vi.fn().mockResolvedValue({ response: 'invalid json' }) })).rejects.toMatchObject({ status: 503 });
  await expect(smartPlace(input, {}, vi.fn().mockResolvedValue(new Response('', { status: 429 })), engine())).rejects.toThrow('Place search is unavailable');
});

it('bounds AI time and rejects invalid inputs before any provider call', async () => {
  vi.useFakeTimers();
  const ai = { run: vi.fn().mockReturnValue(new Promise(() => {})) };
  const request = vi.fn();
  const pending = expect(smartPlace(input, {}, request, ai)).rejects.toMatchObject({ status: 503 });
  await vi.advanceTimersByTimeAsync(20000);
  await pending;
  expect(request).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  for (const invalid of ['', 'x'.repeat(4097), 'https://127.0.0.1/private']) {
    await expect(smartPlace(invalid, {}, request, engine())).rejects.toThrow();
  }
});

it('separates provider errors from response parsing without exposing raw error details', async () => {
  for (const [message, expected] of [
    ['3036: private-provider-detail', 'daily free allowance is exhausted'],
    ['3040: private-provider-detail', 'temporarily at capacity'],
    ['5016: private-provider-detail', 'denied this account access'],
    ['5007: private-provider-detail', 'could not find the configured place model'],
    ['JSON mode could not be met: private-provider-detail', 'structured place request'],
    ['3007: private-provider-detail', 'timed out'],
    ['private-provider-detail', 'AI-REQUEST'],
  ]) {
    const error = await smartPlace(input, {}, vi.fn(), { run: vi.fn().mockRejectedValue(new Error(message)) }).catch((cause) => cause);
    expect(error.status).toBe(503);
    expect(error.message).toContain(expected);
    expect(error.message).not.toContain('private-provider-detail');
  }
  await expect(smartPlace(input, {}, vi.fn(), { run: vi.fn().mockRejectedValue({ code: 3042 }) })).rejects.toThrow('AI-3042');
  await expect(smartPlace(input, {}, vi.fn(), { run: vi.fn().mockResolvedValue({ response: 'invalid json' }) })).rejects.toThrow('AI-RESPONSE');
  await expect(smartPlace(input, {}, vi.fn(), { run: vi.fn().mockResolvedValue({}) })).rejects.toThrow('AI-RESPONSE');
});

it('accepts JSON string responses including a code fence without accepting arbitrary prose', async () => {
  for (const response of [JSON.stringify(extracted), '```json\n' + JSON.stringify(extracted) + '\n```']) {
    expect(await smartPlace(input, {}, geocoder(), { run: vi.fn().mockResolvedValue({ response }) })).toMatchObject({ autoAdd: true });
  }
  await expect(smartPlace(input, {}, vi.fn(), { run: vi.fn().mockResolvedValue({ response: 'Here is a place: ' + JSON.stringify(extracted) }) })).rejects.toThrow('AI-RESPONSE');
});
