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
