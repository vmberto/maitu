<script lang="ts">
  import Icon from '#lib/Icon.svelte';
  import { offline } from '#lib/offline';
  import type { List } from '../../../types/main';
  const lists = $derived(
    ($offline.account?.lists.filter(
      (item) => !item.deleted && (item as List).archived,
    ) ?? []) as List[],
  );
</script>

<header class="sticky top-0 bg-gray-100">
  <div class="mx-auto flex h-12 max-w-xl items-center gap-3 px-5">
    <a href="/" class="rubber-button rubber-icon" aria-label="Back to lists"
      ><Icon name="back" /></a
    >
    <h1 class="text-xl font-semibold">Archived Lists</h1>
  </div>
</header>
<main class="mx-auto max-w-xl space-y-3 p-5">
  {#each lists as list (String(list._id))}<a
      href={`/${list.type === 'timeline' ? 'timeline' : 'tasks'}?listId=${encodeURIComponent(String(list._id))}`}
      class="flex items-center gap-3 rounded-lg bg-panel p-4"
      ><span class="text-2xl">{list.emoji}</span><span>{list.title}</span></a
    >{:else}<p class="text-gray-500">No archived lists.</p>{/each}
</main>
