<script lang="ts">
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import { HexColors } from './colors';
  import type { List } from '../../types/main';
  const lists = $derived(($offline.account?.lists ?? [])
    .filter((list) => !list.deleted && !(list as List).archived)
    .toSorted((a, b) => (a as List).index - (b as List).index) as List[]);
</script>

<aside class="lists-sidebar border-r border-gray-200 bg-surface">
  <a href="/" class="flex h-12 items-center px-5 text-xl font-semibold text-primary">maitu</a>
  <nav aria-label="Your lists" class="space-y-1 p-3">
    {#each lists as list (String(list._id))}
      <a
        href={`/${list.type === 'timeline' ? 'timeline' : 'tasks'}?listId=${encodeURIComponent(String(list._id))}`}
        data-sveltekit-preload-code="viewport"
        aria-current={page.url.searchParams.get('listId') === String(list._id) ? 'page' : undefined}
        class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-panel"
        class:bg-panel={page.url.searchParams.get('listId') === String(list._id)}
        style:color={HexColors.get(list.color)}
      ><span class="text-2xl">{list.emoji}</span><span class="min-w-0 break-words font-medium">{list.title}</span></a>
    {/each}
  </nav>
</aside>
