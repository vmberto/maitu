<script lang="ts">
  import { flip } from 'svelte/animate';
  import { commitTaskTitle } from '#lib/task-title';
  import { HexColors } from '#lib/colors';
  import Icon from '#lib/Icon.svelte';
  import { autosize } from '#lib/autosize';
  import { sortable } from '#lib/reorder';
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { engine, offline } from '#lib/offline';
  import ListHeader from '#lib/ListHeader.svelte';
  import ListDetails from '#lib/ListDetails.svelte';
  import { normalizeLocation } from '../../lib/location';
  import TaskDetails from '#lib/TaskDetails.svelte';
  import type { List, Task } from '../../../types/main';
  const listId = $derived(page.url.searchParams.get('listId') ?? '');
  const list = $derived(
    $offline.account?.lists.find(
      (item) => item._id === listId && !item.deleted,
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
  let listSettings = $state(false);
  let draft = $state('');
  let titleEdits = $state<Record<string, string>>({});
  let creating = false;
  let error = $state('');
  let detailsId = $state<string | null>(null);
  $effect(() => {
    detailsId = page.url.searchParams.get('taskId');
  });
  let pending = $state<string[]>([]);
  let visible = $state(20);
  let completeVisible = $state(20);
  let completeSentinel = $state<HTMLDivElement | undefined>();
  let sentinel = $state<HTMLButtonElement | undefined>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  onDestroy(() => timers.forEach(clearTimeout));
  const ordered = $derived(
    [...tasks].sort(
      (a, b) =>
        (a.index ?? 0) - (b.index ?? 0) ||
        a.createdAt.localeCompare(b.createdAt) ||
        String(a._id).localeCompare(String(b._id)),
    ),
  );
  const active = $derived(
    ordered.filter(
      (task) => !task.complete || pending.includes(String(task._id)),
    ),
  );
  const completed = $derived(
    ordered
      .filter((task) => task.complete && !pending.includes(String(task._id)))
      .sort(
        (a, b) =>
          (b.completedAt || b.createdAt).localeCompare(
            a.completedAt || a.createdAt,
          ) || String(a._id).localeCompare(String(b._id)),
      ),
  );
  $effect(() => {
    if (!('IntersectionObserver' in window)) {
      completeVisible = completed.length;
      return;
    }
    const activeBatch = visible,
      completedBatch = completeVisible;
    const observers = [
      { node: sentinel, more: () => (visible = activeBatch + 20) },
      {
        node: completeSentinel,
        more: () => (completeVisible = completedBatch + 20),
      },
    ].flatMap(({ node, more }) => {
      if (!node) return [];
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            more();
          }
        },
        { rootMargin: '200px' },
      );
      observer.observe(node);
      return [observer];
    });
    return () => observers.forEach((observer) => observer.disconnect());
  });
  async function addTask(event?: Event) {
    event?.preventDefault();
    if (!draft.trim() || creating) return;
    creating = true;
    try {
      await engine.add('tasks', {
        title: draft.trim(),
        description: '',
        complete: false,
        listId,
        index: tasks.length,
        parentTaskId: null,
        createdAt: new Date().toISOString(),
      });
      draft = '';
      error = '';
    } catch {
      error = 'Could not save this task on your device.';
    } finally {
      creating = false;
    }
  }
  async function complete(task: Task) {
    const id = String(task._id);
    if (list?.archived || task.complete) return;
    pending = [...pending, id];
    try {
      await engine.update('tasks', id, {
        complete: true,
        completedAt: new Date().toISOString(),
      });
      clearTimeout(timers.get(id));
      timers.set(
        id,
        setTimeout(() => {
          pending = pending.filter((item) => item !== id);
          timers.delete(id);
        }, 3000),
      );
    } catch {
      pending = pending.filter((item) => item !== id);
      error = 'Could not save completion on your device.';
    }
  }
</script>

<ListHeader {list} settings={() => (listSettings = true)} />
<main
  class="task-list mx-auto max-w-xl px-5 pb-28"
  style:--list-color={HexColors.get(list?.color ?? 'primary')}
>
  {#if !list}<p class="py-5">This list is unavailable on this device.</p>
  {:else}
    {#if list.archived}<p class="py-3 text-sm text-gray-500">
        Archived · Read only
      </p>{/if}
    <div
      use:sortable={{
        ids: list.archived ? [] : active.map((task) => String(task._id)),
        kind: 'tasks',
        error: (message) => (error = message),
      }}
    >
      {#each active.slice(0, visible) as task (String(task._id))}<div
          animate:flip={{ duration: 180 }}
          data-sort-id={String(task._id)}
          title="Hold to reorder; use arrow keys when the row is focused"
          class="task-row flex items-start gap-2 border-b border-gray-200 py-2"
        >
          {#if !list.archived}<button
              type="button"
              data-sort-key
              aria-label={`Reorder ${task.title}`}
              class="sr-only focus:not-sr-only"
              title="Use arrow keys to reorder">Reorder</button
            >{/if}
          <button
            class="rubber-touch todo-check"
            aria-label="completeTask"
            aria-pressed={task.complete}
            disabled={list.archived || task.complete}
            onclick={() => complete(task)}
          ></button>
          <div class="min-w-0 flex-1">
            <textarea
              use:autosize={task.title}
              aria-label={`Task ${task.title}`}
              value={titleEdits[String(task._id)] ?? task.title}
              readonly={list.archived}
              class="todo-title w-full resize-none overflow-hidden border-0 bg-transparent text-gray-900"
              rows="1"
              onblur={async (event) => {
                const id = String(task._id);
                const title = titleEdits[id] ?? event.currentTarget.value;
                try {
                  await commitTaskTitle(id, title, !!list?.archived);
                  delete titleEdits[id];
                } catch {
                  error = 'Could not save this task on your device.';
                }
              }}
              oninput={(event) => {
                titleEdits[String(task._id)] = event.currentTarget.value;
                void engine
                  .update('tasks', String(task._id), {
                    title: event.currentTarget.value,
                  })
                  .catch(
                    () => (error = 'Could not save this task on your device.'),
                  );
              }}></textarea>{#if task.tags?.length}<div
                class="mt-1 flex flex-wrap gap-1"
              >
                {#each Array.from(new Set(task.tags)) as tag (tag)}<span
                    class="rounded-md px-2 py-0.5 text-xs text-white"
                    style:background-color="var(--list-color)"
                    >{tag}</span
                  >{/each}
              </div>{/if}
          </div>
          <!-- Location is a lightweight link beside task actions. -->
          {#if normalizeLocation(task.location)}<a
              href={`/tasks/map?listId=${listId}&taskId=${task._id}`}
              aria-label={`See ${task.title} on map`}
              class="rubber-touch text-sm text-gray-500"
              ><Icon name="map" size={16} /></a
            >{/if}
          <button
            aria-label={`Task details ${task.title}`}
            class="rubber-button rubber-icon text-gray-500"
            onclick={() => (detailsId = String(task._id))}
            ><Icon name="dots" /></button
          >
        </div>{/each}
    </div>
    {#if visible < active.length}<button
        bind:this={sentinel}
        class="rubber-button my-3 w-full"
        onclick={() => (visible += 20)}>More tasks</button
      >{/if}
    {#if !list.archived}<form
        onsubmit={addTask}
        class="task-row flex items-start gap-2 border-b border-gray-200 py-2"
      >
        <span class="todo-check opacity-60" aria-hidden="true"></span>
        <textarea
          aria-label="New task"
          data-task-input
          bind:value={draft}
          use:autosize={draft}
          rows="1"
          class="todo-title w-full resize-none overflow-hidden border-0 bg-transparent"
          onblur={() => void addTask()}
          onkeydown={(event) => {
            if (event.key === 'Enter' && !event.isComposing) {
              event.preventDefault();
              void addTask();
            }
          }}></textarea>
        <button type="submit" class="sr-only">Add task</button>
      </form>{/if}
    {#if completed.length}<h2
        class="mt-16 mb-3 flex items-center justify-between border-b border-gray-200 py-3 font-semibold"
      >
        Complete Tasks <span
          class="rounded-full bg-panel px-2.5 py-1 text-sm font-normal text-gray-500"
          aria-label="Total completed tasks">{completed.length}</span
        >
      </h2>{/if}
    {#each completed.slice(0, completeVisible) as task (String(task._id))}<div
        class="task-row completed-row flex items-center gap-2 border-b border-gray-200 py-2"
      >
        <button
          class="rubber-touch todo-check"
          aria-label="completeTask"
          aria-pressed="true"
          disabled
          title="Completed tasks cannot be reopened"
        ></button>
        <div class="min-w-0 flex-1">
          <textarea
            aria-label={`Task ${task.title}`}
            value={titleEdits[String(task._id)] ?? task.title}
            use:autosize={task.title}
            readonly={list.archived}
            rows="1"
            class="todo-title w-full resize-none border-0 bg-transparent text-gray-600"
            oninput={(event) => {
              titleEdits[String(task._id)] = event.currentTarget.value;
              void engine
                .update('tasks', String(task._id), {
                  title: event.currentTarget.value,
                })
                .catch(() => (error = 'Could not save this task.'));
            }}
            onblur={async (event) => {
              const id = String(task._id);
              try {
                await commitTaskTitle(
                  id,
                  titleEdits[id] ?? event.currentTarget.value,
                  !!list?.archived,
                );
                delete titleEdits[id];
              } catch {
                error = 'Could not save this task.';
              }
            }}></textarea>
          {#if task.tags?.length}<div class="mt-0.5 flex flex-wrap gap-1">
              {#each Array.from(new Set(task.tags)) as tag (tag)}<span
                  class="rounded-md px-2 py-0.5 text-xs text-white"
                  style:background-color="var(--list-color)"
                  >{tag}</span
                >{/each}
            </div>{/if}
        </div>
        {#if normalizeLocation(task.location)}<a
            href={`/tasks/map?listId=${listId}&taskId=${task._id}`}
            aria-label={`See ${task.title} on map`}
            class="rubber-touch text-gray-500"><Icon name="map" size={16} /></a
          >{/if}<button
          class="rubber-button rubber-icon"
          aria-label={`Task details ${task.title}`}
          onclick={() => (detailsId = String(task._id))}
          ><Icon name="dots" /></button
        >
      </div>{/each}
    {#if completeVisible < completed.length}<div
        bind:this={completeSentinel}
        class="h-2"
        aria-hidden="true"
      ></div>{/if}
    {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  {/if}
</main>
{#if detailsId}<TaskDetails
    taskId={detailsId}
    readonly={!!list?.archived}
    close={() => (detailsId = null)}
  />{/if}

{#if listSettings && list}<ListDetails
    {list}
    close={() => (listSettings = false)}
  />{/if}
