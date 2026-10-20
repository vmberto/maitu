<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import CompletionToggle from '#lib/ui/CompletionToggle.svelte';
  import LinkButton from '#lib/ui/LinkButton.svelte';
  import { flip } from 'svelte/animate';
  import { commitTaskTitle } from '#lib/task-title';
  import { HexColors } from '#lib/colors';
  import Icon from '#lib/ui/Icon.svelte';
  import { autosize } from '#lib/autosize';
  import { sortable } from '#lib/reorder';
  import { onDestroy, onMount } from 'svelte';
  import { matchesDate, schedulePriority, scheduleLabel, type DateFilter } from '../../lib/scheduling';
  import { page } from '$app/state';
  import { engine, offline } from '#lib/offline';
  import Tabs from '#lib/ui/Tabs.svelte';
  import ArchivedItems from '#lib/ArchivedItems.svelte';
  import { entryType } from '#lib/list-types';
  import { entriesForView } from '../../lib/entries';
  import ListHeader from '#lib/ListHeader.svelte';
  import { normalizeLocation } from '../../lib/location';
  import type { List, Task } from '../../../types/main';
  const listId = $derived(page.url.searchParams.get('listId') ?? '');
  const list = $derived(
    $offline.account?.lists.find(
      (item) => item._id === listId && !item.deleted,
    ) as List | undefined,
  );
  const mixed = $derived(list?.type === 'mixed');
  const notesOnly = $derived(list?.type === 'notes');
  let selectedFilter = $state('tasks');
  const filter = $derived(notesOnly ? 'notes' : selectedFilter);
  let dateFilter = $state<DateFilter>('all');
  let now = $state(new Date());
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  onMount(() => {
    const refresh = () => { now = new Date(); };
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  });
  const listTasks = $derived(
    ($offline.account?.tasks.filter((item) => !item.deleted &&
      String((item as Task).listId) === listId) ?? []).map((item) => notesOnly ? { ...item, type: entryType(item as Task, 'notes') } : item) as Task[],
  );
  const hasScheduledTasks = $derived(listTasks.some((task) => task.type !== 'note' && (task.schedule || task.wasScheduled)));
  const tasks = $derived(entriesForView(listTasks, mixed, filter, false).filter((task) => filter === 'notes' || matchesDate(task, hasScheduledTasks ? dateFilter : 'all', now, zone)));
  const archivedEntries = $derived(entriesForView(listTasks, mixed, filter, true));
  let listSettings = $state(false);
  let draft = $state('');
  let titleEdits = $state<Record<string, string>>({});
  let creating = $state(false);
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
      (task) => task.type === 'note' || !task.complete || pending.includes(String(task._id)),
    ).sort((a, b) => schedulePriority(a, now, zone) - schedulePriority(b, now, zone)),
  );
  const completed = $derived(
    ordered
      .filter((task) => task.type !== 'note' && task.complete && !pending.includes(String(task._id)))
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
    if (!draft.trim() || creating) return false;
    creating = true;
    try {
      await engine.add('tasks', {
        title: draft.trim(),
        description: '',
        complete: false,
        ...(mixed || notesOnly ? { type: filter === 'notes' ? 'note' as const : 'task' as const } : {}),
        listId,
        index: Math.max(-1, ...listTasks.map((task) => task.index ?? 0)) + 1,
        parentTaskId: null,
        createdAt: new Date().toISOString(),
      });
      draft = '';
      error = '';
      return true;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not save this task on your device.';
      return false;
    } finally {
      creating = false;
    }
  }
  async function complete(task: Task) {
    const id = String(task._id);
    if (list?.archived || task.type === 'note') return;
    if (task.complete) {
      if (!pending.includes(id)) return;
      try {
        await engine.update('tasks', id, { complete: false, completedAt: null });
        clearTimeout(timers.get(id));
        timers.delete(id);
        pending = pending.filter((item) => item !== id);
      } catch {
        error = 'Could not save completion on your device.';
      }
      return;
    }
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
    <div class="list-filters flex items-center justify-between gap-3 border-gray-200" class:border-b={mixed} class:py-1={!mixed}>
      {#if mixed}<Tabs label="Entry filter" appearance="underline" value={filter}
        options={[{ value: 'tasks', label: 'Tasks' }, { value: 'notes', label: 'Notes' }]}
        onchange={(value) => { selectedFilter = value; visible = 20; completeVisible = 20; }} />{/if}
      {#if filter !== 'notes' && hasScheduledTasks}<select aria-label="Date filter" class="ml-auto max-w-[50%] rounded-lg border-0 bg-panel py-1 pl-3 pr-8 text-sm text-gray-500" bind:value={dateFilter} onchange={() => { visible = 20; completeVisible = 20; }}>
        <option value="all">All Tasks</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="upcoming">Upcoming</option>
      </select>{/if}
    </div>
    <div role={mixed ? 'tabpanel' : undefined} aria-label={mixed ? (filter === 'tasks' ? 'Tasks' : 'Notes') : undefined}>
    {#if list.archived}<p class="py-3 text-sm text-gray-500">
        Archived · Read only
      </p>{/if}
    {#snippet activeRows(items: Task[])}
    <div use:sortable={{ ids: list.archived ? [] : items.filter((task) => schedulePriority(task, now, zone) === 2).map((task) => String(task._id)), kind: 'tasks', error: (message) => error = message }}>
      {#each items.slice(0, visible) as task (String(task._id))}<div
          animate:flip={{ duration: 180 }}
          data-sort-id={String(task._id)}
          title={schedulePriority(task, now, zone) < 2 ? undefined : 'Hold to reorder; use arrow keys when the row is focused'}
          class="task-row flex items-start gap-2 border-b border-gray-200 py-2"
        >
          {#if !list.archived && schedulePriority(task, now, zone) === 2}<button
              type="button"
              data-sort-key
              aria-label={`Reorder ${task.title}`}
              class="sr-only focus:not-sr-only"
              title="Use arrow keys to reorder">Reorder</button
            >{/if}
          {#if task.type === 'note'}<Button variant="touch" class="shrink-0 p-1 text-primary" aria-label={`Open note ${task.title}`} onclick={() => detailsId = String(task._id)}><Icon name="note" size={24} /></Button>{:else}<CompletionToggle
            aria-label="completeTask"
            aria-pressed={task.complete}
            disabled={list.archived}
            onclick={() => complete(task)}
          ></CompletionToggle>{/if}
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
              }}></textarea>
            {#if task.tags?.length}<div
                class="task-tags flex flex-wrap gap-1"
              >
                {#each Array.from(new Set(task.tags)) as tag (tag)}<span
                    class="rounded-md px-2 py-0.5 text-xs text-white"
                    style:background-color="var(--list-color)"
                    >{tag}</span
                  >{/each}
              </div>{/if}
          </div>
          {#if task.schedule}<Button variant="touch" class={`max-w-[40%] shrink-0 truncate px-2 text-xs leading-7 ${schedulePriority(task, now, zone) < 2 ? 'rounded-full bg-primary/10 font-semibold text-primary' : 'text-gray-500'}`} aria-label={`Schedule ${task.title}`} title={scheduleLabel(task.schedule, now, zone)} onclick={() => detailsId = String(task._id)}>{scheduleLabel(task.schedule, now, zone)}</Button>{/if}
          {#if normalizeLocation(task.location)}<LinkButton variant="touch"
              href={`/tasks/map?listId=${listId}&taskId=${task._id}`}
              aria-label={`See ${task.title} on map`}
              class="task-action text-sm text-gray-500"
              ><Icon name="map" size={16} /></LinkButton
            >{/if}
          <Button icon
            aria-label={`${filter === 'notes' ? 'Note' : 'Task'} details ${task.title}`}
            class="task-action text-gray-500"
            onclick={() => (detailsId = String(task._id))}
            ><Icon name="dots" /></Button
          >
        </div>{/each}
    </div>
    {/snippet}
    {@render activeRows(active)}
    {#if visible < active.length}<Button
        bind:element={sentinel}
        class="my-3 w-full"
        onclick={() => (visible += 20)}>More tasks</Button
      >{/if}
    {#if !list.archived}<div class="task-creation"><form
        onsubmit={(event) => void addTask(event)}
        class="task-row flex items-start gap-2 border-b border-gray-200 py-2"
      >
        <span class:todo-check={!mixed && !notesOnly} class="shrink-0 p-0.5 text-primary opacity-60" aria-hidden="true">{#if mixed || notesOnly}<Icon name="plus" size={24} />{/if}</span>
        <textarea
          aria-label={filter === 'notes' ? "New note" : "New task"}
          placeholder={list.type === 'places' ? 'Add place…' : mixed || notesOnly ? (filter === 'notes' ? "Add note…" : "Add task…") : undefined}
          data-task-input
          bind:value={draft}
          use:autosize={draft}
          rows="1"
          class="todo-title w-full resize-none overflow-hidden border-0 bg-transparent"
          onblur={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.closest('.task-creation')?.contains(event.relatedTarget)) void addTask(); }}
          onkeydown={(event) => {
            if (event.key === 'Enter' && !event.isComposing) {
              event.preventDefault();
              void addTask();
            }
          }}></textarea>
        <button type="submit" class="sr-only">{filter === 'notes' ? "Add note" : "Add task"}</button>
      </form>
    </div>{/if}
    {#if completed.length}<h2
        class="mt-16 flex items-center justify-between border-b border-gray-200 py-3 font-semibold"
      >
        Complete Tasks <span
          class="rounded-full bg-panel px-2.5 py-1 text-sm font-normal text-gray-500"
          aria-label="Total completed tasks">{completed.length}</span
        >
      </h2>{/if}
    {#each completed.slice(0, completeVisible) as task (String(task._id))}<div
        class="task-row completed-row flex items-start gap-2 border-b border-gray-200 py-2"
      >
        <CompletionToggle
          aria-label="completeTask"
          aria-pressed="true"
          disabled
          title="Completed tasks cannot be reopened"
        ></CompletionToggle>
        <div class="min-w-0 flex-1">
          <textarea
            aria-label={`Task ${task.title}`}
            value={titleEdits[String(task._id)] ?? task.title}
            use:autosize={task.title}
            readonly={true}
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
          {#if task.tags?.length}<div class="task-tags flex flex-wrap gap-1">
              {#each Array.from(new Set(task.tags)) as tag (tag)}<span
                  class="rounded-md px-2 py-0.5 text-xs text-white"
                  style:background-color="var(--list-color)"
                  >{tag}</span
                >{/each}
            </div>{/if}
        </div>
        {#if normalizeLocation(task.location)}<LinkButton variant="touch"
            href={`/tasks/map?listId=${listId}&taskId=${task._id}`}
            aria-label={`See ${task.title} on map`}
            class="task-action text-gray-500"><Icon name="map" size={16} /></LinkButton
          >{/if}<Button icon
          class="task-action"
          aria-label={`${filter === 'notes' ? 'Note' : 'Task'} details ${task.title}`}
          onclick={() => (detailsId = String(task._id))}
          ><Icon name="dots" /></Button
        >
      </div>{/each}
    {#if completeVisible < completed.length}<div
        bind:this={completeSentinel}
        class="h-2"
        aria-hidden="true"
      ></div>{/if}
    </div>
    {#if filter !== 'notes'}<ArchivedItems items={archivedEntries} openItem={(id) => detailsId = id} />{/if}
    {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  {/if}
</main>
{#if detailsId}{#key detailsId}{#await import('#lib/TaskDetails.svelte') then module}{@const TaskDetails = module.default}<TaskDetails
    taskId={detailsId}
    readonly={!!list?.archived}
    close={() => (detailsId = null)}
  />{/await}{/key}{/if}

{#if listSettings && list}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    {list}
    close={() => (listSettings = false)}
  />{/await}{/if}
