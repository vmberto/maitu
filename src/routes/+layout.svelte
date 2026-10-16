<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { blockPageZoom } from '../lib/page-zoom';
  import { version } from '$app/env';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { engine, offline } from '#lib/offline';
  import '../styles/app.css';
  import '../lib/ui/tokens.css';
  import '../lib/ui/buttons.css';
  import '../lib/ui/drawer.css';
  let { children } = $props();
  onMount(() => {
    if (window.location.pathname !== '/login') return engine.start();
  });
  onMount(blockPageZoom);
  onMount(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator)
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {});
  });
  onMount(() => {
    const message = (event: MessageEvent) => {
      if (event.data?.type === 'REPORT_VERSION')
        event.ports[0]?.postMessage(version);
    };
    const ready = () =>
      navigator.serviceWorker.controller?.postMessage({ type: 'CLIENT_READY' });
    navigator.serviceWorker?.addEventListener('message', message);
    navigator.serviceWorker?.addEventListener('controllerchange', ready);
    window.addEventListener('focus', ready);
    ready();
    return () => {
      navigator.serviceWorker?.removeEventListener('message', message);
      navigator.serviceWorker?.removeEventListener('controllerchange', ready);
      window.removeEventListener('focus', ready);
    };
  });
  const conflict = $derived($offline.account?.queue.find((op) => op.conflict));
</script>

<svelte:head><title>maitu</title></svelte:head>
{#if page.url.pathname === '/login'}
  {@render children()}
{:else}
  {#if !$offline.online}<p role="status" class="bg-panel px-5 py-2 text-sm">
      Offline. Changes are saved on this device.
    </p>{/if}
  {#if $offline.storageError}<p role="alert" class="p-4 text-danger">
      {$offline.storageError}
    </p>{/if}
  {#if $offline.status.startsWith('Sign in')}<p
      role="status"
      class="p-4 text-sm"
    >
      {$offline.status}<Button
        class="ml-3"
        onclick={() => engine.sync(true)}>Retry sync</Button
      >
    </p>{/if}
  {#if conflict}<section
      aria-label="Sync conflict"
      class="bg-panel p-4 text-sm"
    >
      <h2 class="font-semibold">A change needs your attention</h2>
      <p>{conflict.conflict?.message}</p>
      {#if conflict.conflict?.server && !conflict.conflict.server.deleted && conflict.action !== 'create'}<Button
          class="mr-3"
          onclick={() => engine.resolve(conflict, true)}>Keep my change</Button
        >{/if}
      <Button

        onclick={() => engine.resolve(conflict, false)}
        >{conflict.conflict?.server
          ? 'Use server version'
          : 'Discard this device change'}</Button
      >
    </section>{/if}
  {#if $offline.updateWaiting}<p class="p-3 text-sm">
      A new version is ready. <Button

        onclick={() => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => location.reload(),
            { once: true },
          );
          $offline.updateWaiting?.postMessage({ type: 'SKIP_WAITING' });
        }}>Update app</Button
      >
    </p>{/if}
  {#if !$offline.ready}<div
      aria-label="Loading saved lists"
      class="mx-auto max-w-xl animate-pulse space-y-3 p-5"
    >
      <div class="h-12 rounded-lg bg-panel"></div>
      <div class="h-20 rounded-lg bg-panel"></div>
    </div>
  {:else if $offline.account}<div class="route-content" data-route={page.url.pathname + page.url.search}>
        <div class="route-pane min-w-0">{#key page.url.pathname + page.url.search}<div class="route-enter">{@render children()}</div>{/key}</div>
    </div>
  {:else}<p class="p-5">
      Sign in online once to save your data for offline use. <a
        href="/login"
        class="underline">Sign in</a
      >
    </p>{/if}
{/if}
