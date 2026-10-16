import { smartPlace } from './smart-place.server';

const source = 'https://terracodapraca.com.br/contact';
const pin = 'https://www.google.com/maps/place/Terraco+da+Praca/data=!3d-8.063!4d-34.871';
const candidate = { name: 'Terraço da Praça', address: 'Praça Example, Recife, Brazil', latitude: -8.063, longitude: -34.871, source_url: source, coordinate_url: pin };
const env = { OPENAI_API_KEY: 'server-only-key' };
function response(places = [candidate], resolution = 'resolved', sourceUrls = [source, pin]) {
  return Response.json({ status: 'completed', output: [
    { type: 'web_search_call', status: 'completed', action: { sources: sourceUrls.map((url) => ({ url, title: 'Venue location' })) } },
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify({ resolution, message: '', places }) }] },
  ] });
}

it('uses the original URL with a bounded grounded GPT request and server-only credentials', async () => {
  const request = vi.fn().mockResolvedValue(response());
  const input = 'https://www.google.com/search?q=terraco+da+praca&sourceid=chrome';
  const result = await smartPlace(input, env, request);
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(url).toBe('https://api.openai.com/v1/responses');
  expect(options.redirect).toBe('manual');
  expect(options.headers.Authorization).toBe('Bearer server-only-key');
  expect(JSON.parse(options.body)).toMatchObject({ model: 'gpt-5.4-mini', input, store: false, max_tool_calls: 3, tool_choice: 'required', text: { format: { type: 'json_schema', strict: true } } });
  expect(result).toMatchObject({ autoAdd: true, places: [{ name: candidate.name, latitude: -8.063, longitude: -34.871, source: 'manual', placeId: 'manual' }] });
  expect(result.sources.map((item) => item.url)).toContain(source);
  expect(JSON.stringify(result)).not.toContain(env.OPENAI_API_KEY);
});

it('asks for configuration before paid requests and bypasses GPT for explicit coordinates', async () => {
  const request = vi.fn();
  await expect(smartPlace('Terraco da Praca', {}, request)).rejects.toMatchObject({ status: 503 });
  expect(await smartPlace('Marco Zero\n-8.063, -34.871', {}, request)).toMatchObject({ autoAdd: true, places: [{ name: 'Marco Zero', latitude: -8.063 }] });
  expect(await smartPlace('https://www.google.com/maps/search/?query=-8.063,-34.871', {}, request)).toMatchObject({ autoAdd: true, places: [{ latitude: -8.063 }] });
  await expect(smartPlace('https://127.0.0.1/private', env, request)).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});

it('never auto-adds ambiguous matches, invented pin links or camera coordinates', async () => {
  const ambiguous = await smartPlace('Terraco', env, vi.fn().mockResolvedValue(response([candidate], 'ambiguous')));
  expect(ambiguous.autoAdd).toBe(false);
  const notRetrieved = await smartPlace('Terraco', env, vi.fn().mockResolvedValue(response([candidate], 'resolved', [source])));
  expect(notRetrieved.autoAdd).toBe(false);
  expect(notRetrieved.places).toHaveLength(1);
  const camera = 'https://www.google.com/maps/place/Terraco/@-8.063,-34.871,16z';
  expect((await smartPlace('Terraco', env, vi.fn().mockResolvedValue(response([{ ...candidate, coordinate_url: camera }], 'resolved', [source, camera])))).autoAdd).toBe(false);
  expect((await smartPlace('Terraco', env, vi.fn().mockResolvedValue(response([{ ...candidate, latitude: -8.1 }])))).autoAdd).toBe(false);
});

it('rejects unsourced identities and malformed coordinates even when the model claims success', async () => {
  for (const patch of [{ source_url: 'https://invented.com' }, { latitude: 91 }, { longitude: -181 }, { name: '' }, { address: '' }]) {
    const result = await smartPlace('Terraco', env, vi.fn().mockResolvedValue(response([{ ...candidate, ...patch }])));
    expect(result.places).toEqual([]);
    expect(result.autoAdd).toBe(false);
  }
});

it('keeps failed, incomplete and refused engine responses recoverable without leaking credentials', async () => {
  for (const mocked of [new Response('', { status: 429 }), new Response('', { status: 401 }), Response.json({ status: 'incomplete', output: [] }), Response.json({ status: 'completed', output: [] })]) {
    await expect(smartPlace('Terraco', env, vi.fn().mockResolvedValue(mocked))).rejects.toMatchObject({ status: 503 });
  }
  await expect(smartPlace('Terraco', env, vi.fn().mockRejectedValue(new Error('server-only-key failed')))).rejects.toThrow('could not finish');
});

it('distinguishes API billing failures from temporary rate limits without exposing provider text', async () => {
  for (const [code, expected] of [
    ['credit_balance_exhausted', 'credits are exhausted'],
    ['project_spend_limit_exceeded', 'spending limit reached'],
    ['organization_spend_limit_exceeded', 'spending limit reached'],
    ['organization_usage_limit_exceeded', 'organization usage limit reached'],
    ['insufficient_quota', 'quota is unavailable'],
    ['usage_limit_exceeded', 'quota is unavailable'],
    ['rate_limit_exceeded', 'temporarily rate-limiting'],
    ['slow_down', 'temporarily rate-limiting'],
    ['unknown', 'HTTP 429'],
  ]) {
    const request = vi.fn().mockResolvedValue(Response.json({ error: { code, message: 'server-only-key sensitive provider text' } }, { status: 429 }));
    const error = await smartPlace('Terraco', env, request).catch((cause) => cause);
    expect(error.status).toBe(503);
    expect(error.message).toContain(expected);
    expect(error.message).not.toContain('server-only-key');
    expect(request).toHaveBeenCalledTimes(1);
  }
  await expect(smartPlace('Terraco', env, vi.fn().mockResolvedValue(Response.json({ error: { type: 'insufficient_quota' } }, { status: 429 })))).rejects.toThrow('quota is unavailable');
});
