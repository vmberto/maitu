<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { autosize } from '#lib/autosize';
  import { page } from '$app/state';
  import { engine, offline } from '#lib/offline';
  import ListHeader from '#lib/ListHeader.svelte';
  import type { List, Task } from '../../../types/main';
  const listId = $derived(page.url.searchParams.get('listId') ?? '');
  const list = $derived(
    $offline.account?.lists.find(
      (item) => !item.deleted && item._id === listId,
    ) as List | undefined,
  );
  const listItems = $derived(
    ($offline.account?.tasks.filter(
      (item) =>
        !item.deleted &&
        String((item as Task).listId) === listId,
    ) ?? []) as Task[],
  );
  const tasks = $derived(listItems.filter((item) => !item.archived && !item.parentTaskId));
  let visible = $state(20);
  let sentinel = $state<HTMLButtonElement | undefined>();
  $effect(() => { listId; visible = 20; });
  $effect(() => {
    const batch = visible;
    if (!sentinel || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        visible = batch + 20;
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  });
  const days = $derived.by(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, visible)) {
      const day = task.createdAt.slice(0, 10);
      const entries = grouped.get(day);
      if (entries) entries.push(task);
      else grouped.set(day, [task]);
    }
    return [...grouped];
  });
  let draft = $state(''),
    error = $state('');
  let settings = $state(false);
  async function add(event: SubmitEvent) {
    event.preventDefault();
    if (!draft.trim() || list?.archived) return;
    try {
      await engine.add('tasks', {
        title: draft.trim(),
        description: '',
        complete: false,
        type: 'note',
        listId,
        createdAt: new Date().toISOString(),
      });
      draft = '';
    } catch {
      error = 'Could not save this entry.';
    }
  }
</script>

<ListHeader {list} settings={() => (settings = true)} />
<main class="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-xl flex-col gap-6 px-5 pt-5">
  {#if !list}<p>This list is unavailable on this device.</p>{:else}
    {#if list.archived}<p class="text-sm text-gray-500">Archived · Read only</p>{/if}
    <div class="flex-1 space-y-6">
    {#each days as [day, entries] (day)}<section>
        <h2 class="mb-4 font-semibold">
          {new Date(`${day}T12:00:00`).toLocaleDateString()}
        </h2>
        <div class="space-y-4">
          {#each entries as task (String(task._id))}<article
              class="max-w-prose"
            >
              <div class="flex items-center justify-between">
                <time class="text-xs text-gray-500"
                  >{new Date(task.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</time
                >
              </div>
              <p class="whitespace-pre-wrap leading-relaxed">{task.title}</p>
            </article>{/each}
        </div>
      </section>{/each}
    {#if visible < tasks.length}<Button bind:element={sentinel} class="my-3 w-full" onclick={() => visible += 20}>More entries</Button>{/if}
    </div>
    {#if error}<p role="alert" class="text-danger">{error}</p>{/if}
    {#if !list.archived}<form onsubmit={add} class="sticky bottom-0 flex items-end gap-3 border-t border-gray-200 bg-gray-100 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <textarea aria-label="New entry" bind:value={draft} placeholder="what's up?" use:autosize={draft}
        class="todo-title min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent" rows="1"></textarea>
      <Button icon tone="primary" type="submit" aria-label="Add entry"><span aria-hidden="true">→</span></Button>
    </form>{/if}
  {/if}
</main>
{#if settings && list}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    {list}
    close={() => (settings = false)}
  />{/await}{/if}
