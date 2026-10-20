<script lang="ts">
  import LinkButton from '#lib/ui/LinkButton.svelte';
  import Button from '#lib/ui/Button.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import { normalizeLocation } from './location';
  import { HexColors } from './colors';
  import type { List, Task } from '../../types/main';
  let { list, settings }: { list?: List; settings?: () => void } = $props();
  const map = $derived(page.url.pathname === '/tasks/map');
  const located = $derived(
    $offline.account?.tasks.some(
      (task) =>
        !task.deleted &&
        !(task as Task).archived &&
        String((task as Task).listId) === String(list?._id) &&
        normalizeLocation((task as Task).location),
    ),
  );
  const color = $derived(HexColors.get(list?.color ?? 'primary'));
</script>

<header class="sticky top-0 z-20 bg-gray-100">
  <div class="mx-auto flex h-12 max-w-xl items-center gap-3 px-5">
    <LinkButton icon
      href={list?.folderId ? `/?folderId=${encodeURIComponent(list.folderId)}` : '/'}
      aria-label="Back to lists"

      style={`color: ${color}`}><Icon name="back" /></LinkButton
    >
    <h1 class="min-w-0 flex-1 truncate text-xl font-semibold" style:color>
      {list?.title ?? 'Tasks'}
    </h1>
    {#if list}<LinkButton icon href={`/archived/items?listId=${encodeURIComponent(String(list._id))}`} aria-label="Archived Items"  style={`color: ${color}`}><Icon name="archive" /></LinkButton>{/if}
    {#if located || list?.type === 'places'}<LinkButton icon
        href={`${map ? (list?.type === 'timeline' ? '/timeline' : '/tasks') : '/tasks/map'}?listId=${encodeURIComponent(String(list?._id))}`}
        aria-label={map ? 'Show tasks' : 'Show map'}

        style={`color: ${color}`}
        aria-current={map ? 'page' : undefined}
        ><Icon name={map ? 'menu' : 'map'} /></LinkButton
      >{/if}{#if settings}<Button icon
        class="text-2xl"
        aria-label="List settings"
        onclick={settings}>{list?.emoji}</Button
      >{:else}<span class="text-2xl">{list?.emoji}</span>{/if}
  </div>
</header>
