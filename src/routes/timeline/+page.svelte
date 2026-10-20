<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import ArchivedItems from '#lib/ArchivedItems.svelte';
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
  let detailsId = $state<string | null>(null);
  const days = $derived.by(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
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
<main class="mx-auto max-w-xl space-y-6 p-5">
  {#if !list}<p>This list is unavailable on this device.</p>{:else}
    {#if list.archived}<p class="text-sm text-gray-500">
        Archived · Read only
      </p>{:else}<form
        onsubmit={add}
        class="flex items-end gap-3 border-b border-gray-200 p-2"
      >
        <textarea
          aria-label="New entry"
          bind:value={draft}
          placeholder="what's up?"
          use:autosize={draft}
          class="todo-title min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent"
          rows="1"></textarea><Button icon tone="primary" type="submit"
          aria-label="Add entry"
          ><span aria-hidden="true">→</span></Button
        >
      </form>{/if}
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
              <p class="whitespace-pre-wrap leading-relaxed"><button type="button" class="w-full whitespace-pre-wrap text-left" aria-label={`Note details ${task.title}`} onclick={() => detailsId = String(task._id)}>{task.title}</button></p>
            </article>{/each}
        </div>
      </section>{/each}
    <ArchivedItems notesOnly items={listItems.filter((item) => item.archived)} openItem={(id) => detailsId = id} />
  {/if}{#if error}<p role="alert" class="text-danger">{error}</p>{/if}
</main>
{#if settings && list}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    {list}
    close={() => (settings = false)}
  />{/await}{/if}

{#if detailsId}{#key detailsId}{#await import('#lib/TaskDetails.svelte') then module}{@const TaskDetails = module.default}<TaskDetails taskId={detailsId} readonly={!!list?.archived} close={() => detailsId = null} />{/await}{/key}{/if}
