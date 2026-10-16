<script lang="ts">
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import { normalizeLocation } from './location';
  import { lockBody } from './scroll-lock';
  import type { List, Task, TaskLocation } from '../../types/main';
  import type * as Leaflet from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  let { embedded = false }: { embedded?: boolean } = $props();
  const listId = $derived(page.url.searchParams.get('listId'));
  const list = $derived(
    $offline.account?.lists.find(
      (item) => !item.deleted && item._id === listId,
    ) as List | undefined,
  );
  const tasks = $derived(
    ($offline.account?.tasks.filter(
      (item) =>
        !item.deleted &&
        !(item as Task).archived &&
        String((item as Task).listId) === listId &&
        normalizeLocation((item as Task).location),
    ) ?? []) as Task[],
  );
  let container: HTMLDivElement;
  let drawer: HTMLDialogElement;
  let unlock: (() => void) | undefined;
  let query = $state('');
  let selectedId = $state(page.url.searchParams.get('taskId'));
  let map = $state<Leaflet.Map | null>(null);
  let library = $state<typeof Leaflet | null>(null);
  let error = $state('');
  let markerById = $state.raw(new Map<string, Leaflet.Marker>());
  let cards = $state<HTMLDivElement>();
  let scrollTimer: ReturnType<typeof setTimeout>;
  let centerTimer: ReturnType<typeof setTimeout>;
  let centering = false;
  let fitted = false;
  let focusedLocation = '';
  const markerData = $derived(JSON.stringify(tasks.map((task) => ({ id: String(task._id), complete: task.complete, location: normalizeLocation(task.location)! }))));
  const selected = $derived(
    tasks.find((task) => String(task._id) === selectedId),
  );
  const place = $derived(normalizeLocation(selected?.location));
  const filtered = $derived(
    tasks.filter((task) =>
      `${task.title} ${normalizeLocation(task.location)?.name ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  );
  onMount(() => {
    let cancelled = false;
    void import('leaflet')
      .then((L) => {
        if (cancelled) return;
        const instance = L.map(container, { zoomControl: true }).setView(
          [0, 0],
          2,
        );
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(instance);
        library = L;
        map = instance;
      })
      .catch(
        () =>
          (error =
            'Could not open the map. Your locations are still saved on this device.'),
      );
    return () => {
      cancelled = true;
      map?.remove();
    };
  });
  onDestroy(() => { unlock?.(); clearTimeout(scrollTimer); clearTimeout(centerTimer); });
  $effect(() => {
    if (!map || !library) return;
    const instance = map,
      L = library;
    const nextMarkers = new Map<string, Leaflet.Marker>();
    const entries = JSON.parse(markerData) as { id: string; complete: boolean; location: TaskLocation }[];
    const markers = entries.map((task, index) => {
      const location = task.location;
      const marker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: 'location-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px #0004;background:${task.complete ? '#16a34a' : '#3664FF'};color:white;font-weight:600">${index + 1}</span>`,
        }),
      })
        .addTo(instance)
        .on('click', () => (selectedId = task.id));
      nextMarkers.set(task.id, marker);
      return marker;
    });
    markerById = nextMarkers;
    if (!fitted && markers.length) {
      fitted = true;
      instance.fitBounds(L.featureGroup(markers).getBounds(), {
      padding: [50, 80],
      maxZoom: 16,
      });
    }
    return () => { markers.forEach((marker) => marker.remove()); };
  });
  $effect(() => {
    if (!map) return;
    for (const [id, marker] of markerById) {
      const active = id === selectedId;
      marker.setZIndexOffset(active ? 10000 : 0);
      marker.setOpacity(selectedId && !active ? 0.5 : 1);
      marker.getElement()?.classList.toggle('selected-marker', active);
    }
    const focus = place ? `${selectedId}:${place.latitude}:${place.longitude}` : '';
    if (place && focus !== focusedLocation) {
      map.stop();
      map.flyTo([place.latitude, place.longitude], Math.max(17, map.getZoom()), {
      duration: 0.4,
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
    }
    focusedLocation = focus;
  });
  $effect(() => {
    if (!cards || !selectedId) return;
    const card = Array.from(cards.children).find((item) => (item as HTMLElement).dataset.taskId === selectedId) as HTMLElement | undefined;
    if (card) {
      centering = true;
      clearTimeout(centerTimer);
      cards.scrollTo({ left: card.offsetLeft - (cards.clientWidth - card.clientWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      centerTimer = setTimeout(() => centering = false, 600);
    }
  });
  function scrollCards() {
    if (centering) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!cards) return;
      const center = cards.scrollLeft + cards.clientWidth / 2;
      const nearest = Array.from(cards.children).reduce<HTMLElement | null>((best, item) => {
        const card = item as HTMLElement;
        const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
        return !best || distance < Math.abs(best.offsetLeft + best.clientWidth / 2 - center) ? card : best;
      }, null);
      if (nearest?.dataset.taskId) selectedId = nearest.dataset.taskId;
    }, 150);
  }
  function interruptCentering() {
    centering = false;
    clearTimeout(centerTimer);
    cards?.scrollTo({ left: cards.scrollLeft, behavior: 'instant' });
  }
</script>

<div class="map-page relative" class:embedded style:height={embedded ? 'clamp(240px, 35dvh, 360px)' : 'calc(100dvh - 3rem)'}>
  <div
    bind:this={container}
    class="h-full w-full"
    aria-label="Task locations map"
  ></div>
  <button
    class="rubber-button absolute right-4 top-4 z-[500] bg-surface text-gray-900 shadow-sm"
    onclick={() => {
      drawer.showModal();
      unlock = lockBody();
    }}>Locations ({tasks.length})</button
  >
  {#if selected && place}<div role="region" bind:this={cards} onpointerdown={interruptCentering} onwheel={interruptCentering} onscrollend={() => centering = false} onscroll={scrollCards} class="map-cards absolute bottom-5 left-0 right-0 z-[500]" aria-label="Task location cards">
    {#each tasks as task (String(task._id))}{@const location = normalizeLocation(task.location)!}<section
      data-task-id={String(task._id)}
      class:active={String(task._id) === selectedId}
      class:complete={task.complete}
      aria-label={`${task.title}, ${task.type === 'note' ? 'note' : task.complete ? 'completed' : 'to do'}`}
      class="map-card rounded-xl bg-surface p-4 text-gray-900 shadow-lg"
    >
      {#if String(task._id) !== selectedId}<button type="button" class="map-card-select" aria-label={`Focus ${task.title} on map`} onclick={() => selectedId = String(task._id)}></button>{/if}
      <button
        aria-label="Close map card"
        class="rubber-button rubber-icon float-right"
        onclick={() => (selectedId = null)}>×</button
      >
      <h2 class="font-semibold">{task.title}</h2>
      {#if location.name !== task.title}<p class="text-sm text-gray-500">
          {location.name}
        </p>{/if}
      <p class="text-sm text-gray-500">
        {location.address || `${location.latitude}, ${location.longitude}`}
      </p>
      <a
        class="rubber-button mt-3 inline-block text-primary"
        href={`/${list?.type === 'timeline' ? 'timeline' : 'tasks'}?listId=${listId}&taskId=${task._id}`}
        >{task.type === 'note' ? 'Open note' : 'Open task'}</a
      >
      <a class="rubber-button ml-2 mt-3 inline-block text-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer">Directions</a>
    </section>{/each}</div>{/if}
  {#if error}<p
      role="alert"
      class="absolute bottom-5 left-4 z-[500] rounded-lg bg-surface p-4"
    >
      {error}
    </p>{/if}
</div>
<dialog
  use:drawerBehavior={'right'}
  bind:this={drawer}
  oncancel={(event) => {
    event.preventDefault();
    closeDrawer(drawer);
  }}
  onclose={() => {
    unlock?.();
    unlock = undefined;
  }}
  class="m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-surface p-5 text-gray-900"
>
  <header class="drawer-header" data-drawer-header>
    <h2 class="mb-5 font-semibold">Locations</h2>
    <button
      class="rubber-button rubber-icon float-right"
      aria-label="Close locations"
      onclick={() => closeDrawer(drawer)}>×</button
    >
  </header>
  <div class="drawer-body">
    <input
      aria-label="Search locations"
      class="drawer-input mb-4"
      bind:value={query}
      placeholder="Search locations"
    />
    <div class="space-y-3">
      {#each filtered as task (String(task._id))}<button
          class="rubber-button w-full text-left"
          onclick={() => {
            selectedId = String(task._id);
            closeDrawer(drawer);
          }}
          ><span
            class="mr-2 inline-block size-2 rounded-full"
            style:background={task.complete ? '#16a34a' : '#3664FF'}
          ></span>{task.title}</button
        >{/each}
    </div>
  </div>
</dialog>

<style>
  .embedded { isolation: isolate; }
  .map-cards { --card-width: min(390px, 85vw); display: flex; gap: 12px; overflow-x: auto; padding: 8px calc((100% - var(--card-width)) / 2); scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
  .map-cards::-webkit-scrollbar { display: none; }
  .map-card { --status-color: #3664ff; position: relative; flex: 0 0 var(--card-width); min-width: 0; border-top: 3px solid var(--status-color); scroll-snap-align: center; opacity: 0.4; transform: scale(0.97); transition: opacity 220ms ease, transform 220ms ease; }
  .map-card.complete { --status-color: #16a34a; }
  .map-card h2::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 50%; background: var(--status-color); vertical-align: middle; }
  .map-card-select { position: absolute; inset: 0; z-index: 1; border-radius: inherit; cursor: pointer; }
  .map-card-select:focus-visible { outline: 2px solid #3664ff; outline-offset: -2px; }
  .map-card.active { opacity: 1; transform: scale(1); }
  :global(.location-marker.selected-marker > span) { outline: 5px solid rgb(255 255 255 / 65%); box-shadow: 0 0 0 9px rgb(54 100 255 / 35%), 0 4px 12px #0005 !important; transform: scale(1.15); }
  @media (prefers-reduced-motion: reduce) { .map-card { transition: none; } }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
