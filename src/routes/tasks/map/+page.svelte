<script lang="ts">
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import ListHeader from '#lib/ListHeader.svelte';
  import { normalizeLocation } from '../../../lib/location';
  import { lockBody } from '../../../lib/scroll-lock';
  import type { List, Task } from '../../../../types/main';
  import type * as Leaflet from 'leaflet';
  import 'leaflet/dist/leaflet.css';
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
  onDestroy(() => unlock?.());
  $effect(() => {
    if (!map || !library || !tasks.length) return;
    const instance = map,
      L = library;
    const markers = tasks.map((task, index) => {
      const location = normalizeLocation(task.location)!;
      return L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px #0004;background:${task.complete ? '#16a34a' : '#3664FF'};color:white;font-weight:600">${index + 1}</span>`,
        }),
      })
        .addTo(instance)
        .on('click', () => (selectedId = String(task._id)));
    });
    instance.fitBounds(L.featureGroup(markers).getBounds(), {
      padding: [50, 80],
      maxZoom: 16,
    });
    return () => markers.forEach((marker) => marker.remove());
  });
  $effect(() => {
    if (map && place) map.panTo([place.latitude, place.longitude]);
  });
</script>

<ListHeader {list} />
<main class="relative h-[calc(100dvh-3rem)]">
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
  {#if selected && place}<section
      class="absolute bottom-5 left-4 right-4 z-[500] mx-auto max-w-xl rounded-xl bg-surface p-4 text-gray-900 shadow-lg"
    >
      <button
        aria-label="Close map card"
        class="rubber-button rubber-icon float-right"
        onclick={() => (selectedId = null)}>×</button
      >
      <h2 class="font-semibold">{selected.title}</h2>
      {#if place.name !== selected.title}<p class="text-sm text-gray-500">
          {place.name}
        </p>{/if}
      <p class="text-sm text-gray-500">
        {place.address || `${place.latitude}, ${place.longitude}`}
      </p>
      <a
        class="rubber-button mt-3 inline-block text-primary"
        href={`/${list?.type === 'timeline' ? 'timeline' : 'tasks'}?listId=${listId}&taskId=${selected._id}`}
        >Open task</a
      >
    </section>{/if}
  {#if error}<p
      role="alert"
      class="absolute bottom-5 left-4 z-[500] rounded-lg bg-surface p-4"
    >
      {error}
    </p>{/if}
</main>
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
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
