'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { normalizeLocation, parseCoordinates } from '@/src/lib/location';
import type { TaskLocation } from '@/types/main';

export function ManualCoordinates({
  location,
  title,
  busy,
  onSave,
}: {
  location: TaskLocation | null;
  title: string;
  busy: boolean;
  onSave: (place: TaskLocation) => Promise<void>;
}) {
  const [coordinates, setCoordinates] = useState(
    location ? `${location.latitude}, ${location.longitude}` : '',
  );
  const parsed = parseCoordinates(coordinates);
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const place = normalizeLocation({
      name: ((location?.name || title).trim() || 'Pinned location').slice(
        0,
        300,
      ),
      address: '',
      latitude: parsed?.latitude,
      longitude: parsed?.longitude,
      source: 'manual',
      placeId: 'manual',
    });
    if (!parsed || !place) {
      setError(
        'Paste latitude, longitude. Latitude must be between −90 and 90; longitude between −180 and 180.',
      );
      return;
    }
    setError('');
    void onSave(place);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm text-gray-600">
        Coordinates
        <input
          value={coordinates}
          onChange={(event) => setCoordinates(event.target.value)}
          placeholder="-8.063000, -34.881000"
          maxLength={200}
          required
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          className="drawer-input mt-1"
        />
      </label>
      {parsed && (
        <p className="text-xs text-gray-500" aria-live="polite">
          Latitude {parsed.latitude} · Longitude {parsed.longitude}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rubber-button rubber-primary text-sm"
      >
        {busy ? 'Saving…' : 'Save coordinates'}
      </button>
    </form>
  );
}
