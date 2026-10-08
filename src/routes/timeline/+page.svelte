<script lang="ts">
  import { autosize } from '#lib/autosize';
  import { page } from '$app/state';
  import { engine, offline } from '#lib/offline';
  import ListHeader from '#lib/ListHeader.svelte';
  import ListDetails from '#lib/ListDetails.svelte';
  import type { List, Task } from '../../../types/main';
  const listId = $derived(page.url.searchParams.get('listId') ?? '');
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
        !(item as Task).parentTaskId,
    ) ?? []) as Task[],
  );
  const days = $derived(
    Array.from(new Set(tasks.map((task) => task.createdAt.slice(0, 10))))
      .sort()
      .reverse(),
  );
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
          rows="1"></textarea><button
          aria-label="Add entry"
          class="rubber-button rubber-icon rubber-primary"
          ><span aria-hidden="true">→</span></button
        >
      </form>{/if}
    {#each days as day (day)}<section>
        <h2 class="mb-4 font-semibold">
          {new Date(`${day}T12:00:00`).toLocaleDateString()}
        </h2>
        <div class="space-y-4">
          {#each tasks
            .filter((task) => task.createdAt.startsWith(day))
            .sort( (a, b) => b.createdAt.localeCompare(a.createdAt) ) as task (String(task._id))}<article
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
  {/if}{#if error}<p role="alert" class="text-danger">{error}</p>{/if}
</main>
{#if settings && list}<ListDetails
    {list}
    close={() => (settings = false)}
  />{/if}
