import { normalizeLocation, photonPlaces } from './location';

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
