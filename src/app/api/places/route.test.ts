/** @jest-environment node */
import { GET } from './route';
import { isAuthenticated } from '@/src/lib/session';

jest.mock('@/src/lib/session', () => ({ isAuthenticated: jest.fn() }));
const originalFetch = global.fetch;
const upstream = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = upstream;
  jest
    .mocked(isAuthenticated)
    .mockResolvedValue({
      _id: 'user',
      username: 'User',
      email: 'u@example.com',
    });
});
afterAll(() => {
  global.fetch = originalFetch;
});

it('requires authentication and bounded queries before calling the provider', async () => {
  jest.mocked(isAuthenticated).mockResolvedValue(null);
  expect(
    (await GET(new Request('http://localhost/api/places?q=Recife'))).status,
  ).toBe(401);
  jest
    .mocked(isAuthenticated)
    .mockResolvedValue({
      _id: 'user',
      username: 'User',
      email: 'u@example.com',
    });
  for (const q of ['', 'aa', 'x'.repeat(201)])
    expect(
      (await GET(new Request(`http://localhost/api/places?q=${q}`))).status,
    ).toBe(400);
  expect(upstream).not.toHaveBeenCalled();
});

it('encodes a search and returns normalized places, handles no results and provider failure', async () => {
  upstream.mockResolvedValueOnce(
    Response.json({
      features: [
        {
          properties: {
            name: 'Restaurant X',
            city: 'Recife',
            osm_type: 'W',
            osm_id: 123,
          },
          geometry: { type: 'Point', coordinates: [-34.881, -8.063] },
        },
      ],
    }),
  );
  const request = new Request(
    'http://localhost/api/places?q=Restaurant%20X%20Recife',
  );
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect((await response.json()).places[0]).toMatchObject({
    latitude: -8.063,
    longitude: -34.881,
    placeId: 'W123',
  });
  expect(upstream.mock.calls[0][0].searchParams.get('q')).toBe(
    'Restaurant X Recife',
  );
  expect(upstream.mock.calls[0][0].searchParams.get('limit')).toBe('6');
  upstream.mockResolvedValueOnce(Response.json({ features: [] }));
  expect(await (await GET(request)).json()).toEqual({ places: [] });
  upstream.mockResolvedValueOnce(new Response('Unavailable', { status: 429 }));
  expect((await GET(request)).status).toBe(503);
});
