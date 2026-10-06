'use client';

import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { EllipsisHorizontalIcon, MapIcon } from '@heroicons/react/24/solid';
import { AppLink } from '@/src/components/Offline/AppLink';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { ManualCoordinates } from './ManualCoordinates';
import { normalizeLocation } from '@/src/lib/location';
import type { Task, TaskLocation } from '@/types/main';

export function LocationAddon({ task }: { task: Task }) {
  const { handleUpdateTask } = useTasks();
  const inputId = useId();
  const location = normalizeLocation(task.location);
  const legacyLocation = typeof task.location === 'string' ? task.location : '';
  const [editing, setEditing] = useState(!task.location);
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState(legacyLocation || task.title);
  const [results, setResults] = useState<TaskLocation[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!navigator.onLine) {
      setError(
        'Connect to the internet to search places. Saved locations are available offline.',
      );
      return;
    }
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError('');
    setResults([]);
    setSearched(false);
    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(query.trim())}`,
        {
          signal: request.signal,
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not search places.');
      if (!Array.isArray(data.places))
        throw new Error('Could not read place results.');
      setResults(
        data.places
          .map(normalizeLocation)
          .filter(
            (place: TaskLocation | null): place is TaskLocation => !!place,
          ),
      );
      setSearched(true);
    } catch (err) {
      if (!request.signal.aborted)
        setError(
          err instanceof Error ? err.message : 'Could not search places.',
        );
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  async function save(place: TaskLocation | null) {
    setBusy(true);
    setError('');
    try {
      await handleUpdateTask({
        _id: task._id,
        location: place,
        addons: place ? ['location'] : [],
      })();
      setEditing(false);
      setResults([]);
      setSearched(false);
    } catch {
      setError(
        'Could not save this location on your device. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="drawer-section drawer-reveal"
      aria-label="Location add-on"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">Location</h2>
        <Menu>
          <MenuButton
            disabled={busy}
            aria-label="Location options"
            className="rubber-button rubber-icon rounded-lg p-1 text-gray-500 hover:bg-gray-200"
          >
            <EllipsisHorizontalIcon className="size-5" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            transition
            className="z-50 min-w-44 rounded-lg bg-surface p-1 shadow-lg ring-1 ring-gray-200 transition duration-150 data-[closed]:opacity-0 motion-reduce:transition-none"
          >
            <MenuItem>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rubber-button rubber-row rubber-quiet block w-full rounded-md px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
              >
                Change location
              </button>
            </MenuItem>
            <MenuItem>
              <button
                type="button"
                onClick={() => void save(null)}
                className="rubber-button rubber-row rubber-quiet block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-gray-100"
              >
                Remove location add-on
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
      {location || legacyLocation ? (
        <div className="flex items-start gap-2">
          <MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="break-words font-medium">
              {location?.name || legacyLocation}
            </p>
            {location && (
              <>
                <p className="break-words text-sm text-gray-500">
                  {location.address}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Lat {location.latitude.toFixed(6)} · Long{' '}
                  {location.longitude.toFixed(6)}
                </p>
              </>
            )}
            {location && (
              <AppLink
                href={`/tasks/map?listId=${encodeURIComponent(String(task.listId))}&taskId=${encodeURIComponent(String(task._id))}`}
                className="rubber-button rubber-primary mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <MapIcon className="size-4" />
                See on Map
              </AppLink>
            )}
          </div>
        </div>
      ) : !editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rubber-button flex items-center gap-2 py-1 text-sm text-primary"
        >
          <MapPinIcon className="size-5" /> Find a place
        </button>
      ) : null}
      {editing && (
        <div className="drawer-reveal mt-2">
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              disabled={busy}
              aria-pressed={!manual}
              onClick={() => {
                setManual(false);
                setError('');
              }}
              className="rubber-button"
            >
              Search places
            </button>
            <button
              type="button"
              disabled={busy}
              aria-pressed={manual}
              onClick={() => {
                setManual(true);
                setError('');
              }}
              className="rubber-button"
            >
              Enter coordinates
            </button>
          </div>
          {manual ? (
            <ManualCoordinates
              location={location}
              title={task.title}
              busy={busy}
              onSave={save}
            />
          ) : (
            <>
              <form onSubmit={search}>
                <label htmlFor={inputId} className="sr-only">
                  Place name and city
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={inputId}
                    className="drawer-input min-w-0"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setResults([]);
                      setSearched(false);
                    }}
                    placeholder="Place name and city"
                    minLength={3}
                    maxLength={200}
                    required
                    disabled={busy}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={busy || query.trim().length < 3}
                    className="rubber-button shrink-0 rounded-md px-2 py-1 text-sm text-primary disabled:opacity-50"
                  >
                    {busy ? 'Searching…' : 'Search'}
                  </button>
                </div>
              </form>
              {results.length > 0 && (
                <ul
                  aria-label="Places"
                  className="drawer-reveal mt-2 space-y-1"
                >
                  {results.map((place) => (
                    <li key={place.placeId}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void save(place)}
                        className="rubber-button rubber-row rubber-quiet w-full rounded-md px-2 py-2 text-left hover:bg-gray-700/10 focus-visible:outline-primary"
                      >
                        <span className="block font-medium">{place.name}</span>
                        <span className="block text-sm text-gray-500">
                          {place.address}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searched && !results.length && (
                <p role="status" className="mt-2 text-sm text-gray-500">
                  No places found. Try adding the city or street.
                </p>
              )}
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setError('');
            }}
            className="rubber-button mt-2 text-sm text-gray-500"
          >
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {((editing && !manual) || location?.source === 'openstreetmap') && (
        <p className="mt-2 text-xs text-gray-500">
          Places by{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            OpenStreetMap contributors
          </a>
        </p>
      )}
    </section>
  );
}
