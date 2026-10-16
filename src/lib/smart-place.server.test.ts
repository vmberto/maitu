import { smartPlace } from './smart-place.server';
import { normalizeSmartPlace } from './smart-place';
import { pagePins } from './place-research.server';

const name = 'Clarice Bistrô e Café';
const address = 'Avenida Doutor Seixas 48';
const source = 'https://clarice.com/contact';
const pin = new URL('https://external-content.duckduckgo.com/ssv2/');
pin.searchParams.set('annotations', JSON.stringify([{ point: '-8.030953,-34.924978' }]));
pin.searchParams.set('center', '50,50');
const text = `${name}\n${address}, Recife\nServimos café da manhã e jantar.\n`;
const fields = { resolution: 'resolved', name, address, city: 'Recife', source: 'source1', tags: [{ name: 'Breakfast', evidence: 'café da manhã', source: 'source1' }, { name: 'Dinner', evidence: 'jantar', source: 'source1' }] };
const input = 'https://www.google.com/search?q=clarice+bistro&sourceid=chrome';
const feature = { geometry: { type: 'Point', coordinates: [-34.924978, -8.030953] }, properties: { name, city: 'Recife', street: address, osm_type: 'N', osm_id: 123 } };
const engine = (value: unknown = fields) => ({ run: vi.fn().mockResolvedValue({ response: value }) });
function providers(options: { pins?: string[]; features?: unknown[]; text?: string } = {}) {
  const pins = options.pins ?? [pin.href];
  return vi.fn(async (url: Parameters<typeof fetch>[0]) => {
    const target = String(url);
    if (target.startsWith('https://r.jina.ai/https://duckduckgo.com/')) return Response.json({ data: { title: name, content: text + pins.map((url) => `![Map](${url})`).join('\n'), links: [['Venue', source]] } });
    if (target === `https://r.jina.ai/${source}`) return Response.json({ data: { title: name, content: options.text ?? text, url: source } });
    if (target.startsWith('https://photon.komoot.io/')) return Response.json({ features: options.features ?? [feature] });
    throw new Error('Unexpected provider host');
  });
}
afterEach(() => vi.useRealTimers());

it('researches the actual Clarice venue, uses a retrieved pin and adds supported categories', async () => {
  const ai = engine();
  const request = providers();
  const result = await smartPlace(input, {}, request, ai);
  expect(ai.run).toHaveBeenCalledTimes(1);
  expect(ai.run.mock.calls[0]).toMatchObject(['@cf/meta/llama-3.1-8b-instruct-fp8', { max_tokens: 700, response_format: { type: 'json_object' } }]);
  expect(ai.run.mock.calls[0][1].response_format).not.toHaveProperty('json_schema');
  const research = JSON.parse(ai.run.mock.calls[0][1].messages[1].content);
  expect(research.query).toBe('clarice bistro');
  expect(research.pages.some((page: any) => page.url === source)).toBe(true);
  expect(result).toMatchObject({ autoAdd: true, places: [{ name, address: `${address}, Recife`, latitude: -8.030953, longitude: -34.924978, tags: ['Breakfast', 'Dinner'] }] });
  expect(request.mock.calls.every(([url]) => String(url).startsWith('https://r.jina.ai/'))).toBe(true);
  expect(result.sources.some((page) => page.url === source)).toBe(true);
});

it('rejects the unrelated French bistro even if the geocoder returns it as the only match', async () => {
  const france = { ...feature, properties: { ...feature.properties, name: 'Le Bistrot du Marché', city: 'Montguyon', street: 'Route de Clairvent' } };
  const result = await smartPlace(input, {}, providers({ pins: [], features: [france] }), engine());
  expect(result).toMatchObject({ autoAdd: false, places: [] });
  expect(result.message).toContain('Identified Clarice');
  expect(result.message).not.toContain('Le Bistrot');
  const otherAddress = { ...feature, properties: { ...feature.properties, street: 'Rua Outra 999' } };
  expect(await smartPlace(input, {}, providers({ pins: [], features: [otherAddress] }), engine())).toMatchObject({ autoAdd: false, places: [] });
});

it('rejects unrelated researched identities and invented fields before geocoding', async () => {
  for (const patch of [{ name: 'Le Bistrot du Marché' }, { city: 'Lisbon' }, { address: 'Invented street 12' }, { source: 'invented' }, { city: null }]) {
    const request = providers();
    expect(await smartPlace(input, {}, request, engine({ ...fields, ...patch }))).toMatchObject({ autoAdd: false, places: [] });
    expect(request.mock.calls.some(([url]) => String(url).includes('photon'))).toBe(false);
  }
});

it('does not use map camera centers or model-generated coordinates', async () => {
  const camera = 'https://google.com/maps/place/Clarice/@50,50,15z';
  const result = await smartPlace(input, {}, providers({ pins: [camera], features: [] }), engine({ ...fields, latitude: 50, longitude: 50 }));
  expect(result).toMatchObject({ autoAdd: false, places: [] });
  expect(pagePins({ id: 'test', title: '', text: '', url: source, links: [pin.href] })).toEqual([{ latitude: -8.030953, longitude: -34.924978 }]);
});

it('requires review for conflicting sourced pins or multiple verified venue matches', async () => {
  const otherPin = new URL(pin); otherPin.searchParams.set('annotations', JSON.stringify([{ point: '-8.1,-34.9' }]));
  expect(await smartPlace(input, {}, providers({ pins: [pin.href, otherPin.href] }), engine())).toMatchObject({ autoAdd: false, places: [{ name }] });
  expect(await smartPlace(input, {}, providers({ pins: [], features: [feature, { ...feature, properties: { ...feature.properties, osm_id: 124 } }] }), engine())).toMatchObject({ autoAdd: false });
});

it('uses geocoding only after web identity verification and retains the researched title', async () => {
  const result = await smartPlace(input, {}, providers({ pins: [] }), engine());
  expect(result).toMatchObject({ autoAdd: true, places: [{ name, source: 'openstreetmap', placeId: 'N123', tags: ['Breakfast', 'Dinner'] }] });
});

it('drops unsupported tags and safely normalizes task metadata', async () => {
  const result = await smartPlace(input, {}, providers(), engine({ ...fields, tags: [...fields.tags, { name: 'Museum', evidence: 'famous art collection', source: 'source1' }, { name: 'Burger', evidence: 'hamburgers', source: 'invented' }] }));
  expect(result.places[0].tags).toEqual(['Breakfast', 'Dinner']);
  expect(normalizeSmartPlace({ ...result.places[0], tags: ['Breakfast', 'Breakfast', 5, '', 'x'.repeat(31)] })?.tags).toEqual(['Breakfast']);
});

it('asks for more context when identity is ambiguous or web research fails', async () => {
  expect(await smartPlace(input, {}, providers(), engine({ resolution: 'ambiguous' }))).toMatchObject({ autoAdd: false, places: [] });
  const ai = engine();
  await expect(smartPlace(input, {}, vi.fn().mockResolvedValue(new Response('', { status: 403 })), ai)).rejects.toThrow('Web research is unavailable');
  expect(ai.run).not.toHaveBeenCalled();
  await expect(smartPlace('https://instagram.com/p/private', {}, vi.fn().mockResolvedValue(new Response('', { status: 403 })), ai)).rejects.toMatchObject({ status: 422 });
});

it('keeps explicit map pins and coordinates usable without AI or research', async () => {
  const request = vi.fn();
  expect(await smartPlace('Marco Zero\n-8.063, -34.871', {}, request)).toMatchObject({ autoAdd: true, places: [{ name: 'Marco Zero', tags: [] }] });
  expect(await smartPlace('https://google.com/maps/search/?query=-8.063,-34.871', {}, request)).toMatchObject({ autoAdd: true });
  expect(request).not.toHaveBeenCalled();
  await expect(smartPlace(input, { OPENAI_API_KEY: 'unused-key' }, request)).rejects.toThrow('binding named AI');
  for (const invalid of ['', 'x'.repeat(4097), 'https://127.0.0.1/private']) await expect(smartPlace(invalid, {}, request, engine())).rejects.toThrow();
});

it('keeps provider errors distinct without exposing provider messages', async () => {
  for (const [message, expected] of [['3036: private-detail', 'daily free allowance'], ['3040: private-detail', 'temporarily at capacity'], ['5016: private-detail', 'denied this account'], ['5007: private-detail', 'configured place model'], ['5025: JSON Schema private-detail', 'structured place request'], ['private-detail', 'AI-REQUEST']]) {
    const error = await smartPlace(input, {}, providers(), { run: vi.fn().mockRejectedValue(new Error(message)) }).catch((cause) => cause);
    expect(error.status).toBe(503); expect(error.message).toContain(expected); expect(error.message).not.toContain('private-detail');
  }
});

it('accepts real JSON string responses and rejects arbitrary prose', async () => {
  for (const response of [JSON.stringify(fields), '```json\n' + JSON.stringify(fields) + '\n```']) {
    expect(await smartPlace(input, {}, providers(), engine(response))).toMatchObject({ autoAdd: true });
  }
  await expect(smartPlace(input, {}, providers(), engine('Here is a place: ' + JSON.stringify(fields)))).rejects.toThrow('AI-RESPONSE');
});

it('bounds model waiting time without automatically retrying paid inference', async () => {
  vi.useFakeTimers();
  const ai = { run: vi.fn().mockReturnValue(new Promise(() => {})) };
  const pending = expect(smartPlace(input, {}, providers(), ai)).rejects.toThrow('AI-TIMEOUT');
  await vi.advanceTimersByTimeAsync(25000); await pending;
  expect(ai.run).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
