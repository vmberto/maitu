'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { AppLink } from '@/src/components/Offline/AppLink';
import { Fragment, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { normalizeLocation } from '@/src/lib/location';
import type { Task } from '@/types/main';

export default function TaskMapView({
  tasks,
  focusTaskId,
}: {
  tasks: Task[];
  focusTaskId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(focusTaskId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tileError, setTileError] = useState(!navigator.onLine);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  // A stable data dependency prevents routine sync renders from rebuilding the map.
  const signature = JSON.stringify(
    tasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      complete: !!task.complete,
      listId: String(task.listId),
      location: normalizeLocation(task.location),
    })),
  );
  const places: {
    id: string;
    title: string;
    complete: boolean;
    listId: string;
    location: NonNullable<ReturnType<typeof normalizeLocation>>;
  }[] = JSON.parse(signature);
  const filteredPlaces = places
    .map((place, index) => ({ ...place, number: index + 1 }))
    .filter((place) =>
      `${place.title} ${place.location.name} ${place.location.address}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
  const selected = places.find((place) => place.id === selectedId);
  const initialPoints = useRef<L.LatLngExpression[]>(
    places.map((place) => [place.location.latitude, place.location.longitude]),
  );

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { zoomControl: true });
    if (initialPoints.current.length) {
      map.fitBounds(L.latLngBounds(initialPoints.current), {
        padding: [35, 35],
        maxZoom: 15,
        animate: false,
      });
    } else {
      map.setView([0, 0], 2);
    }
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    const tiles = L.tileLayer(
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;
    const entries: typeof places = JSON.parse(signature);
    const points: L.LatLngExpression[] = [];
    markers.clearLayers();
    entries.forEach((place, index) => {
      const point: L.LatLngExpression = [
        place.location.latitude,
        place.location.longitude,
      ];
      points.push(point);
      const marker = L.marker(point, {
        title: place.title,
        icon: L.divIcon({
          className: `task-map-marker ${place.complete ? 'task-map-marker-complete' : ''}`,
          html: `<span>${index + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      })
        .on('click', () => setSelectedId(place.id))
        .addTo(markers);
      marker.getElement()?.setAttribute('aria-label', `Show ${place.title}`);
    });
    if (points.length)
      map.fitBounds(L.latLngBounds(points), {
        padding: [35, 35],
        maxZoom: 15,
        animate: false,
      });
    const focused = entries.find((place) => place.id === focusTaskId);
    if (focused)
      map.setView([focused.location.latitude, focused.location.longitude], 16, {
        animate: false,
      });
  }, [signature, focusTaskId]);

  return (
    <main className="relative h-[calc(100dvh-3rem)] min-h-[300px] bg-canvas">
      <div
        ref={container}
        aria-label="Map of task locations"
        role="region"
        className="relative z-0 h-full bg-panel"
      />
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="rubber-button absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-gray-900 shadow-lg"
      >
        <MapPinIcon className="size-5 text-primary" />
        Locations ({places.length})
      </button>
      {tileError && (
        <p
          role="status"
          className="absolute right-4 top-16 z-10 max-w-[75%] rounded-lg bg-surface px-3 py-2 text-xs text-gray-500 shadow"
        >
          Street map unavailable. Saved places are available in Locations.
        </p>
      )}
      {selected && (
        <section
          className="drawer-reveal absolute bottom-6 left-4 right-4 z-10 mx-auto max-w-sm rounded-xl bg-surface p-3 shadow-lg"
          aria-label="Selected place"
        >
          <button
            type="button"
            aria-label="Close place details"
            onClick={() => setSelectedId(null)}
            className="rubber-button rubber-icon float-right rounded-lg p-1 text-gray-500"
          >
            <XMarkIcon className="size-5" />
          </button>
          <h2 className="font-semibold">{selected.title}</h2>
          <p className="text-sm text-gray-500">
            {selected.location.name} · {selected.location.address}
          </p>
          <AppLink
            className="rubber-button mt-2 inline-block rounded-md px-3 py-1.5 text-sm text-primary"
            href={`/tasks?listId=${encodeURIComponent(selected.listId)}&taskId=${encodeURIComponent(selected.id)}`}
          >
            Open task
          </AppLink>
        </section>
      )}
      <Transition.Root show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-30">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-200 motion-reduce:duration-0"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200 motion-reduce:duration-0"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-200 ease-out motion-reduce:duration-0"
            enterFrom="translate-y-full sm:translate-y-0 sm:translate-x-full"
            enterTo="translate-y-0 sm:translate-x-0"
            leave="transition-transform duration-200 ease-in motion-reduce:duration-0"
            leaveFrom="translate-y-0 sm:translate-x-0"
            leaveTo="translate-y-full sm:translate-y-0 sm:translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 flex max-h-[80dvh] w-full flex-col rounded-t-2xl bg-surface p-4 shadow-xl sm:top-0 sm:max-h-none sm:max-w-sm sm:rounded-l-2xl sm:rounded-tr-none">
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="text-lg font-semibold">
                  Locations
                </Dialog.Title>
                <button
                  type="button"
                  aria-label="Close locations"
                  onClick={() => setDrawerOpen(false)}
                  className="rubber-button rubber-icon rounded-lg p-1 text-gray-500"
                >
                  <XMarkIcon className="size-6" />
                </button>
              </div>
              <label htmlFor="map-location-search" className="sr-only">
                Search locations
              </label>
              <input
                id="map-location-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search locations"
                className="my-3 w-full shrink-0 rounded-lg border-0 bg-panel px-3 py-2 text-gray-900 focus:ring-primary"
              />
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <ul aria-label="Located tasks" className="space-y-1">
                  {filteredPlaces.map((place) => (
                    <li key={place.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(place.id);
                          setDrawerOpen(false);
                          mapRef.current?.panTo(
                            [place.location.latitude, place.location.longitude],
                            {
                              animate: !window.matchMedia(
                                '(prefers-reduced-motion: reduce)',
                              ).matches,
                            },
                          );
                        }}
                        aria-pressed={selectedId === place.id}
                        className="rubber-button rubber-row rubber-quiet flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-gray-100"
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full ${place.complete ? 'bg-green-600' : 'bg-primary'} text-xs text-white`}
                        >
                          {place.number}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {place.title}
                            <span className="sr-only">
                              {place.complete ? ' Complete' : ' Todo'}
                            </span>
                          </span>
                          <span className="block truncate text-gray-500">
                            {place.location.address}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {!filteredPlaces.length && (
                  <p role="status" className="py-4 text-sm text-gray-500">
                    {query
                      ? 'No matching locations.'
                      : 'No saved locations in this list.'}
                  </p>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </main>
  );
}
