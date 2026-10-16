import { normalizeLocation, photonPlaces, parseCoordinates, placeInput } from './location';

const feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-34.881, -8.063] },
  properties: {
    name: 'Restaurant X',
    street: 'Rua do Sol',
    housenumber: '12',
    city: 'Recife',
    country: 'Brazil',
    osm_type: 'N',
    osm_id: 123,
  },
};

it('converts GeoJSON longitude/latitude to named task coordinates and removes duplicate or malformed places', () => {
  const places = photonPlaces({
    features: [
      feature,
      feature,
      { geometry: {} },
      {
        ...feature,
        geometry: { type: 'Point', coordinates: [200, 95] },
      },
    ],
  });
  expect(places).toEqual([
    {
      name: 'Restaurant X',
      address: 'Rua do Sol 12, Recife, Brazil',
      latitude: -8.063,
      longitude: -34.881,
      source: 'openstreetmap',
      placeId: 'N123',
    },
  ]);
  expect(normalizeLocation({ ...places[0], injected: 'ignored' })).toEqual(
    places[0],
  );
  expect(() => photonPlaces({ error: 'Unavailable' })).toThrow();
});

it('splits pasted coordinate pairs, preserving signs and rejecting missing or out-of-range values', () => {
  for (const text of [
    '-8.063, -34.881',
    '(-8.063, -34.881)',
    '-8.063 -34.881',
    '-8,063; -34,881',
    '−8.063, −34.881',
  ])
    expect(parseCoordinates(text)).toEqual({
      latitude: -8.063,
      longitude: -34.881,
    });
  expect(parseCoordinates('0, 0')).toEqual({ latitude: 0, longitude: 0 });
  for (const text of [
    '',
    '95, -34.881',
    '8, 181',
    'NaN, 10',
    '8',
    '8, 34, 55',
    ', 34',
    '0x10, 20',
  ])
    expect(parseCoordinates(text)).toBeNull();
});

it('extracts Google searches and Instagram location names without requesting arbitrary URLs', () => {
  expect(placeInput('https://www.google.com/search?q=Marco+Zero+Recife')).toEqual({ query: 'Marco Zero Recife' });
  expect(placeInput('https://www.google.com.br/maps/search/?api=1&query=Marco+Zero+Recife')).toEqual({ query: 'Marco Zero Recife' });
  expect(placeInput('https://www.instagram.com/explore/locations/123/marco-zero-recife/')).toEqual({ query: 'marco zero recife' });
  expect(placeInput('Marco Zero Recife')).toEqual({ query: 'Marco Zero Recife' });
  for (const url of ['http://127.0.0.1/private', 'https://google.com.attacker.test/search?q=test', 'https://maps.app.goo.gl/abc', 'https://www.google.com/maps/?cid=123'])
    expect(() => placeInput(url)).toThrow();
  expect(() => placeInput('https://www.instagram.com/reel/abc/')).toThrow('does not identify a place');
  expect(() => placeInput('https://www.instagram.com/p/abc/')).toThrow('does not identify a place');
  expect(() => placeInput('https://google.com/maps/place/%E0%A4%A')).toThrow('valid place URL');
});

it('reads explicit map pins and coordinate queries but never mistakes the camera for a place', () => {
  expect(placeInput('https://www.google.com/maps/search/?api=1&query=-8.063,-34.881').location).toMatchObject({ latitude: -8.063, longitude: -34.881, source: 'manual' });
  expect(placeInput('https://www.google.com/maps/place/Marco+Zero/@1,2,15z/data=!4m2!3d-8.063!4d-34.881').location).toMatchObject({ name: 'Marco Zero', latitude: -8.063, longitude: -34.881 });
  expect(placeInput('https://www.google.com/maps/place/Marco+Zero/@1,2,15z')).toEqual({ query: 'Marco Zero' });
  expect(placeInput('https://www.google.com/maps/place/Marco+Zero/data=!3d99!4d200').location).toBeUndefined();
});
