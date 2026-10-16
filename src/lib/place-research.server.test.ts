import { researchPlace } from './place-research.server';

it('keeps the public reader status and numeric error code without exposing its response text', async () => {
  for (const status of [403, 429, 503]) {
    const request = vi.fn().mockResolvedValue(Response.json({ code: 40305, message: 'private-provider-details' }, { status }));
    const error = await researchPlace('clarice bistro recife', request).catch((cause) => cause);
    expect(error.status).toBe(503);
    expect(error.message).toContain(`WEB-HTTP-${status}-40305`);
    expect(error.message).not.toContain('private-provider-details');
    expect(request).toHaveBeenCalledTimes(1);
  }
});

it('distinguishes source blocking, bad JSON and network timeout failures', async () => {
  const cases = [
    { request: vi.fn().mockResolvedValue(Response.json({ data: { content: '', httpStatus: 403 } })), code: 'WEB-TARGET-403' },
    { request: vi.fn().mockResolvedValue(new Response('invalid json')), code: 'WEB-RESPONSE' },
    { request: vi.fn().mockResolvedValue(new Response('x'.repeat(256001))), code: 'WEB-RESPONSE' },
    { request: vi.fn().mockRejectedValue(new DOMException('private-details', 'TimeoutError')), code: 'WEB-TIMEOUT' },
    { request: vi.fn().mockRejectedValue(new Error('private-details')), code: 'WEB-CONNECTION' },
  ];
  for (const { request, code } of cases) await expect(researchPlace('clarice bistro recife', request)).rejects.toThrow(code);
});

it('keeps a readable venue source when the search reader is unavailable', async () => {
  const request = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: { title: 'Clarice Bistro', content: 'Clarice Bistro, Recife. Breakfast and dinner.' } }))
    .mockResolvedValueOnce(new Response('', { status: 429 }));
  expect((await researchPlace('https://clarice.com/contact', request)).pages).toHaveLength(1);
});

it('authenticates research using the configured server key without exposing it in results', async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ data: { title: 'Clarice', content: 'Clarice Bistro Recife' } }));
  const result = await researchPlace('clarice bistro recife', request, { JINA_API_KEY: 'private-reader-key' });
  expect(request.mock.calls[0][0]).toContain('https://r.jina.ai/');
  expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer private-reader-key');
  expect(JSON.stringify(result)).not.toContain('private-reader-key');
});

it('researches an Instagram profile when its readable title is generic or its page is blocked', async () => {
  for (const profileResponse of [
    Response.json({ data: { title: 'Instagram', content: 'Log in\nSign up' } }),
    new Response('', { status: 403 }),
  ]) {
    const request = vi.fn()
      .mockResolvedValueOnce(profileResponse)
      .mockResolvedValueOnce(Response.json({ data: { title: 'Search results', content: 'Clarice Bistrô e Café, Recife' } }));
    const result = await researchPlace('https://www.instagram.com/claricebistroecafe', request, { JINA_API_KEY: 'private-reader-key' });
    expect(result.query).toBe('claricebistroecafe');
    expect(request.mock.calls[1][0]).toContain('https://duckduckgo.com/?q=claricebistroecafe');
    expect(request.mock.calls[1][1].headers.Authorization).toBe('Bearer private-reader-key');
    expect(result.pages.some((page) => page.id === 'search')).toBe(true);
  }
});

it('does not treat Instagram post IDs, reserved paths or unrelated domains as profile handles', async () => {
  const { instagramProfileHandle } = await import('./place-research.server');
  for (const input of ['https://instagram.com/p/abc', 'https://instagram.com/reel/abc', 'https://instagram.com/accounts', 'https://instagram.com/explore', 'https://notinstagram.com/claricebistroecafe']) expect(instagramProfileHandle(input)).toBeUndefined();
  expect(instagramProfileHandle('https://instagram.com/clarice.bistro_e_cafe/')).toBe('clarice.bistro_e_cafe');
});
