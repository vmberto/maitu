<script lang="ts">
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import ArchivedItems from '#lib/ArchivedItems.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import { entryType } from '#lib/list-types';
  import type { List, Task } from '../../../../types/main';
  const listId = $derived(page.url.searchParams.get('listId'));
  const lists = $derived(($offline.account?.lists ?? []).filter((list) => !list.deleted && (!listId || String(list._id) === listId)) as List[]);
  const groups = $derived(lists.map((list) => ({
    list,
    items: ($offline.account?.tasks ?? []).filter((item) => !item.deleted && (item as Task).archived && String((item as Task).listId) === String(list._id))
      .map((item) => ({ ...item, type: entryType(item as Task, list.type) }) as Task),
  })).filter((group) => group.items.length));
  const currentList = $derived(lists.find((list) => String(list._id) === listId));
  const back = $derived(listId && currentList ? `/${currentList.type === 'timeline' ? 'timeline' : 'tasks'}?listId=${encodeURIComponent(listId)}` : '/');
  let detailsId = $state<string | null>(null);
  const detailsTask = $derived($offline.account?.tasks.find((item) => String(item._id) === detailsId) as Task | undefined);
  const detailsList = $derived(lists.find((list) => String(list._id) === String(detailsTask?.listId)));
</script>

<header class="sticky top-0 z-20 bg-gray-100">
  <div class="mx-auto flex h-12 max-w-xl items-center gap-3 px-5">
    <a href={back} class="rubber-button rubber-icon" aria-label={listId ? 'Back to list' : 'Back to lists'}><Icon name="back" /></a>
    <h1 class="text-xl font-semibold">Archived Items</h1>
  </div>
</header>
<main class="mx-auto max-w-xl space-y-6 px-5 pb-28 pt-5">
  {#each groups as { list, items } (String(list._id))}
    <section aria-label={`${list.title} archive`}>
      <h2 class="flex items-center gap-2 font-semibold"><span>{list.emoji}</span>{list.title}<span class="ml-auto text-sm font-normal text-gray-500">{items.length}</span></h2>
      {#if list.archived}<p class="mt-2 text-sm text-gray-500">Archived list · Read only</p>{/if}
      <ArchivedItems {items} collapsible={false} openItem={(id) => detailsId = id} />
    </section>
  {:else}<p class="text-gray-500">No archived items.</p>{/each}
</main>
{#if detailsId}{#key detailsId}{#await import('#lib/TaskDetails.svelte') then module}{@const TaskDetails = module.default}
  <TaskDetails taskId={detailsId} openItem={(id) => detailsId = id} readonly={!!detailsList?.archived} close={() => detailsId = null} />
{/await}{/key}{/if}
