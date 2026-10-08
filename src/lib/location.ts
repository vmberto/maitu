import type { TaskLocation } from '../../types/main';

export function normalizeLocation(value: unknown): TaskLocation | null {
  if (!value || typeof value !== 'object') return null;
  const place = value as Record<string, unknown>;
  if (
    typeof place.name !== 'string' ||
    !place.name.trim() ||
    place.name.length > 300 ||
    typeof place.address !== 'string' ||
    place.address.length > 1000 ||
    typeof place.latitude !== 'number' ||
    !Number.isFinite(place.latitude) ||
    Math.abs(place.latitude) > 90 ||
    typeof place.longitude !== 'number' ||
    !Number.isFinite(place.longitude) ||
    Math.abs(place.longitude) > 180 ||
    (place.source !== 'openstreetmap' && place.source !== 'manual') ||
    typeof place.placeId !== 'string' ||
    (place.source === 'manual'
      ? place.placeId !== 'manual'
      : !/^[NWR]\d+$/.test(place.placeId))
  )
    return null;
  return {
    name: place.name.trim(),
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    source: place.source,
    placeId: place.placeId,
  };
}

// GeoJSON uses longitude first; tasks store explicitly named coordinates.
export function photonPlaces(data: unknown): TaskLocation[] {
  if (
    !data ||
    typeof data !== 'object' ||
    !('features' in data) ||
    !Array.isArray(data.features)
  )
    throw new Error('Invalid place results.');
  const places = data.features.flatMap((feature: any) => {
    const p = feature?.properties;
    if (!p || feature?.geometry?.type !== 'Point') return [];
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const address = [
      street,
      p.postcode,
      p.city || p.district,
      p.state,
      p.country,
    ]
      .filter((part) => typeof part === 'string' && part)
      .join(', ');
    const place = normalizeLocation({
      name: p.name || street || p.city,
      address,
      latitude: feature.geometry.coordinates?.[1],
      longitude: feature.geometry.coordinates?.[0],
      source: 'openstreetmap',
      placeId: `${p.osm_type}${p.osm_id}`,
    });
    return place ? [place] : [];
  });
  return places
    .filter(
      (place, index) =>
        places.findIndex((other) => other.placeId === place.placeId) === index,
    )
    .slice(0, 6);
}

export function parseCoordinates(
  input: string,
): { latitude: number; longitude: number } | null {
  const text = input
    .trim()
    .replace(/−/g, '-')
    .replace(/^\(([\s\S]*)\)$/, '$1')
    .trim();
  const decimal = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
  const commaDecimal = '[+-]?(?:\\d+(?:,\\d+)?|,\\d+)';
  const match =
    text.match(new RegExp(`^(${decimal})(?:\\s*[,;]\\s*|\\s+)(${decimal})$`)) ??
    text.match(
      new RegExp(`^(${commaDecimal})(?:\\s*;\\s*|\\s+)(${commaDecimal})$`),
    );
  if (!match) return null;
  const latitude = Number(match[1].replace(',', '.'));
  const longitude = Number(match[2].replace(',', '.'));
  return Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}
