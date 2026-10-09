<script lang="ts">
  import Icon from '#lib/Icon.svelte';
  import { autosize } from '#lib/autosize';
  import { HexColors } from './colors';
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { commitTaskTitle } from '#lib/task-title';
  import { engine, offline } from '#lib/offline';
  import { lockBody } from './scroll-lock';
  import { normalizeLocation, parseCoordinates } from './location';
  import type { List, Task, TaskLocation } from '../../types/main';
  let {
    taskId,
    close,
    readonly = false,
  }: { taskId: string; close: () => void; readonly?: boolean } = $props();
  let dialog: HTMLDialogElement;
  let error = $state('');
  let subtask = $state('');
  let addingSubtask = false;
  let tag = $state('');
  let titleDraft = $state<string | null>(null);
  let descriptionDraft = $state<string | null>(null);
  let childDrafts = $state<Record<string, string>>({});
  let locationName = $state('');
  let search = $state('');
  let results = $state<TaskLocation[]>([]);
  let searching = $state(false);
  let selectedPlace = $state<TaskLocation | null>(null);
  let moving = $state(false);
  let destination = $state('');
  const destinations = $derived(($offline.account?.lists ?? []).filter(
    (list) => !list.deleted && !(list as List).archived && (list as List).type === 'tasks' && String(list._id) !== String(task?.listId),
  ) as List[]);
  const detectedCoordinates = $derived(parseCoordinates(search));
  let editLocation = $state(false);
  const task = $derived(
    $offline.account?.tasks.find((task) => task._id === taskId) as
      Task | undefined,
  );
  const children = $derived(
    ($offline.account?.tasks.filter(
      (item) => !item.deleted && String((item as Task).parentTaskId) === taskId,
    ) ?? []) as Task[],
  );
  const listColor = $derived(
    HexColors.get(
      (
        $offline.account?.lists.find(
          (item) => item._id === String(task?.listId),
        ) as import('../../types/main').List | undefined
      )?.color ?? 'primary',
    ),
  );
  function dateLabel(value?: string | null) {
    if (!value || !Number.isFinite(new Date(value).getTime()))
      return 'Date unavailable';
    return new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  async function toggleChild(child: Task) {
    if (readonly) return;
    try {
      await engine.update(
        'tasks',
        String(child._id),
        child.complete
          ? { complete: false, completedAt: null }
          : { complete: true, completedAt: new Date().toISOString() },
      );
    } catch {
      error = 'Could not save this subtask.';
    }
  }
  const place = $derived(normalizeLocation(task?.location));
  $effect(() => {
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    return lockBody();
  });
  async function save(data: Partial<Task>) {
    if (readonly) return;
    try {
      await engine.update('tasks', taskId, data);
      error = '';
    } catch {
      error = 'Could not save this change on your device.';
    }
  }
  async function addSubtask(event?: Event) {
    event?.preventDefault();
    if (!subtask.trim() || readonly || !task || addingSubtask) return;
    addingSubtask = true;
    try {
      await engine.add('tasks', {
        title: subtask.trim(),
        description: '',
        complete: false,
        listId: task.listId,
        parentTaskId: taskId,
        createdAt: new Date().toISOString(),
      });
      subtask = '';
    } catch {
      error = 'Could not save this subtask on your device.';
    } finally {
      addingSubtask = false;
    }
  }
  async function addTag(event?: Event) {
    event?.preventDefault();
    const value = tag.trim();
    if (readonly || !value || task?.tags?.includes(value)) return;
    await save({ tags: [...(task?.tags ?? []), value] });
    if (!error && tag.trim() === value) tag = '';
  }
  async function clone() {
    if (!task || readonly) return;
    try {
      const { _id, ...data } = task;
      const cloned = await engine.add('tasks', {
        ...data,
        title: `${data.title} (Clone)`,
        parentTaskId: null,
        complete: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      });
      for (const child of children) {
        const { _id, ...data } = child;
        await engine.add('tasks', {
          ...data,
          parentTaskId: cloned._id,
          complete: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
      closeDrawer(dialog);
    } catch {
      error = 'Could not clone this task.';
    }
  }
  async function searchPlaces(event: SubmitEvent) {
    event.preventDefault();
    if (detectedCoordinates) return;
    if (searching) return;
    searching = true;
    error = '';
    results = [];
    selectedPlace = null;
    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(search.trim())}`,
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      results = (body.places ?? [])
        .map(normalizeLocation)
        .filter((place: TaskLocation | null): place is TaskLocation => !!place);
      if (!results.length) error = 'No places found. Paste coordinates below.';
    } catch {
      error = 'Place search is unavailable. Paste coordinates below.';
    } finally {
      searching = false;
    }
  }
  async function saveLocation(event: SubmitEvent) {
    event.preventDefault();
    const value = detectedCoordinates;
    if (selectedPlace && !value) {
      await save({ location: selectedPlace, addons: ['location'] });
      if (!error) editLocation = false;
      return;
    }
    if (!value) {
      error = 'Paste valid latitude, longitude coordinates.';
      return;
    }
    await save({
      location: {
        ...value,
        name: locationName.trim() || task?.title || 'Location',
        address: '',
        source: 'manual',
        placeId: 'manual',
      },
      addons: ['location'],
    });
    if (!error) editLocation = false;
  }
  async function moveTask(event: SubmitEvent) {
    event.preventDefault();
    if (readonly || !destinations.some((list) => String(list._id) === destination)) return;
    try {
      await engine.commit((saved) => saved.tasks
        .filter((item) => !item.deleted && (String(item._id) === taskId || String((item as Task).parentTaskId) === taskId))
        .sort((a, b) => Number(String(b._id) === taskId) - Number(String(a._id) === taskId))
        .map((item) => ({ kind: 'tasks', entityId: String(item._id), action: 'patch', data: { listId: destination, index: saved.tasks.filter((task) => String((task as Task).listId) === destination).length } })));
      closeDrawer(dialog);
    } catch { error = 'Could not move this task.'; }
  }
</script>

<dialog
  tabindex="-1"
  use:drawerBehavior
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    closeDrawer(dialog);
  }}
  onclose={close}
  style:--list-color={listColor}
  class:task-complete={task?.complete}
  class="task-drawer w-[calc(100%-1rem)] max-w-xl rounded-2xl bg-surface p-5 text-gray-900 shadow-xl"
>
  <header data-drawer-header class="drawer-header">
    <div class="min-w-0 flex-1">
      <h2 class="mb-5 text-lg font-semibold">
        {#if readonly || task?.complete}{task?.title}{:else}<textarea
            rows="1"
            use:autosize={titleDraft ?? task?.title ?? ''}
            onblur={async (event) => {
              const title = titleDraft ?? event.currentTarget.value;
              try {
                await commitTaskTitle(taskId, title, readonly);
                if (!title.trim()) closeDrawer(dialog);
                titleDraft = null;
              } catch {
                error = 'Could not save this task.';
              }
            }}
            aria-label="Task title"
            value={titleDraft ?? task?.title ?? ''}
            class="w-full resize-none border-0 bg-transparent p-0 font-semibold"
            oninput={(event) => {
              titleDraft = event.currentTarget.value;
              void save({ title: titleDraft });
            }}
          ></textarea>{/if}
      </h2>
      <div class="task-dates mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal text-gray-500">
        <p><span class="task-date-label">Created</span> <time datetime={task?.createdAt}>{dateLabel(task?.createdAt)}</time></p>
        {#if task?.complete}<p><span class="task-status">Completed</span> <time datetime={task.completedAt ?? undefined}>{dateLabel(task.completedAt)}</time></p>{/if}
      </div>
    </div>
    <button
      class="rubber-button rubber-icon float-right"
      aria-label="Close panel"
      onclick={() => closeDrawer(dialog)}>×</button
    >
  </header>
  <div class="drawer-body">
    <section class="rounded-lg bg-panel p-3">
      <textarea
        aria-label="Description"
        placeholder="Write about it…"
        use:autosize={descriptionDraft ?? task?.description ?? ''}
        rows="2"
        value={descriptionDraft ?? task?.description ?? ''}
        {readonly}
        class="task-description w-full resize-none border-0 bg-transparent text-gray-900 focus:ring-primary"
        oninput={(event) => {
          descriptionDraft = event.currentTarget.value;
          void save({ description: descriptionDraft });
        }}
        onblur={async () => {
          if (descriptionDraft !== null) {
            await save({ description: descriptionDraft });
            if (!error) descriptionDraft = null;
          }
        }}></textarea>
    </section>
    <section class="mt-4 rounded-lg bg-panel p-3">
      <h3 class="mb-3 text-sm text-gray-500">Subtasks</h3>
      <div class="space-y-4">
        {#each children as child (String(child._id))}<div
            class="flex items-start gap-3 rounded-md px-1 py-1"
          >
            <button
              type="button"
              class="todo-check rubber-touch"
              aria-label={`${child.complete ? 'Uncomplete' : 'Complete'} subtask ${child.title}`}
              aria-pressed={child.complete}
              disabled={readonly}
              onclick={() => toggleChild(child)}
            ></button>
            <textarea
              aria-label={`Subtask ${child.title}`}
              value={childDrafts[String(child._id)] ?? child.title}
              use:autosize={childDrafts[String(child._id)] ?? child.title}
              rows="1"
              {readonly}
              class:subtask-complete={child.complete}
              class="subtask-title min-w-0 flex-1 resize-none border-0 bg-transparent"
              oninput={(event) => {
                childDrafts[String(child._id)] = event.currentTarget.value;
                void engine
                  .update('tasks', String(child._id), {
                    title: event.currentTarget.value,
                  })
                  .catch(() => (error = 'Could not save this subtask.'));
              }}
              onblur={async (event) => {
                const id = String(child._id);
                try {
                  await commitTaskTitle(
                    id,
                    childDrafts[id] ?? event.currentTarget.value,
                    readonly,
                  );
                  delete childDrafts[id];
                } catch {
                  error = 'Could not save this subtask.';
                }
              }}></textarea>
          </div>{/each}
      </div>
      {#if !readonly}<form
          class="mt-4 flex items-start gap-3"
          onsubmit={addSubtask}
        >
          <span class="todo-check opacity-50" aria-hidden="true"
          ></span><textarea
            aria-label="New subtask"
            placeholder="Add subtask"
            bind:value={subtask}
            use:autosize={subtask}
            rows="1"
            class="subtask-title min-w-0 flex-1 resize-none border-0 bg-transparent"
            onblur={() => void addSubtask()}
            onkeydown={(event) => {
              if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                void addSubtask();
              }
            }}></textarea><button type="submit" class="sr-only">Add</button>
        </form>{:else if !children.length}<p class="text-sm text-gray-500">
          No subtasks
        </p>{/if}
    </section>
    <section class="mt-4 rounded-lg bg-panel p-3">
      <h3 class="mb-3 text-sm text-gray-500">Tags</h3>
      <form class="flex flex-wrap items-center gap-2" onsubmit={addTag}>
        {#each Array.from(new Set(task?.tags ?? [])) as value (value)}<span
            class="inline-flex items-center gap-2 rounded-md bg-surface px-2.5 py-1 text-sm text-gray-700"
            >{value}{#if !readonly}<button
                type="button"
                aria-label={`Remove tag ${value}`}
                class="rubber-touch text-gray-400 hover:text-danger"
                onclick={() =>
                  void save({
                    tags: task?.tags?.filter((item) => item !== value),
                  })}>×</button
              >{/if}</span
          >{/each}
        {#if !readonly}<input
            aria-label="New tag"
            placeholder="Add tag"
            bind:value={tag}
            maxlength="20"
            class="min-w-0 flex-1 basis-28 border-0 bg-transparent text-sm"
            onblur={() => void addTag()}
            onkeydown={(event) => {
              if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                void addTag();
              }
            }}
          /><button type="submit" class="sr-only">Add tag</button
          >{:else if !task?.tags?.length}<p class="text-sm text-gray-500">
            No tags
          </p>{/if}
      </form>
    </section>
    {#if task?.addons?.includes('location') || place}<section
        class="mt-4 rounded-lg bg-panel p-3"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Location</h3>
          {#if !readonly}<details class="relative">
              <summary
                aria-label="Location options"
                class="rubber-button rubber-icon cursor-pointer list-none"
                >…</summary
              >
              <div
                class="absolute right-0 z-10 w-44 rounded-lg bg-surface p-2 shadow-lg"
              >
                <button
                  class="rubber-button block w-full"
                  onclick={() => {
                    editLocation = true;
                    search = place
                      ? `${place.latitude}, ${place.longitude}`
                      : '';
                    locationName = place?.name ?? '';
                  }}>Change location</button
                ><button
                  class="rubber-button block w-full text-danger"
                  onclick={() => void save({ addons: [], location: null })}
                  >Remove location</button
                >
              </div>
            </details>{/if}
        </div>
        {#if place}<p class="mt-2">{place.name}</p>
          <p class="text-sm text-gray-500">
            {place.address || `${place.latitude}, ${place.longitude}`}
          </p>
          <a
            class="rubber-button mt-3 inline-block text-primary"
            href={`/tasks/map?listId=${encodeURIComponent(String(task?.listId))}&taskId=${taskId}`}
            >See on Map</a
          >{/if}
        {#if !readonly && (!place || editLocation)}<form
            onsubmit={searchPlaces}
            class="mt-3 flex gap-3"
          >
            <input
              aria-label="Search places"
              bind:value={search}
              oninput={() => { selectedPlace = null; results = []; }}
              placeholder="Search a place or paste coordinates"
              class="location-search drawer-input min-w-0 flex-1"
              minlength="3"
              maxlength="200"
              required
            /><button class="rubber-button" disabled={searching}
              >{searching ? 'Searching…' : 'Search'}</button
            >
          </form>
          {#if detectedCoordinates}<p class="mt-3 text-sm text-gray-500">Coordinates detected: latitude {detectedCoordinates.latitude}, longitude {detectedCoordinates.longitude}</p>
          {:else}<div class="location-results mt-3 overflow-hidden rounded-lg border border-gray-200">
          {#each results as result (result.placeId)}<button
              class="location-result block w-full border-b border-gray-200 px-3 py-3 text-left last:border-0"
              aria-pressed={selectedPlace?.placeId === result.placeId}
              onclick={() => selectedPlace = result}
              >{result.name}<span class="block text-xs text-gray-500"
                >{result.address}</span
              ></button
            >{/each}</div>{/if}
          <form onsubmit={saveLocation} class="mt-4">
            <button disabled={!detectedCoordinates && !selectedPlace} class="rubber-button rubber-primary w-full py-3">Save location</button>
          </form>{/if}
      </section>{/if}
    {#if !readonly}<details class="task-options mt-5 rounded-lg bg-panel p-3">
        <summary
          class="flex cursor-pointer list-none items-center justify-between font-medium"
          ><span>Task Options</span><span
            class="options-chevron transition-transform"
            ><Icon name="chevron" size={18} /></span
          ></summary
        >
        <div class="mt-4 space-y-4">
          <section>
            <h3 class="mb-2 text-sm text-gray-500">Actions</h3>
            <button class="rubber-touch option-row" onclick={() => moving = !moving}><Icon name="back" size={18} /><span>Move Task</span></button>
            {#if moving}<form onsubmit={moveTask} class="my-2 space-y-2">
              <select aria-label="Destination list" bind:value={destination} class="drawer-input"><option value="">Choose a tasks list</option>{#each destinations as list (list._id)}<option value={String(list._id)}>{list.emoji} {list.title}</option>{/each}</select>
              <button class="rubber-button rubber-primary w-full" disabled={!destination}>Move task</button>
            </form>{/if}
            <button class="rubber-touch option-row" onclick={clone}
              ><Icon name="clone" size={18} /><span>Clone Task</span></button
            ><button
              class="rubber-touch option-row text-danger"
              onclick={async () => {
                try {
                  await engine.remove('tasks', taskId);
                  closeDrawer(dialog);
                } catch {
                  error = 'Could not delete this task.';
                }
              }}><Icon name="trash" size={18} /><span>Delete Task</span></button
            >
          </section>
          <section>
            <h3 class="mb-2 text-sm text-gray-500">Add-ons</h3>
            <button
              class="rubber-touch option-row"
              disabled={task?.addons?.includes('location')}
              onclick={() => void save({ addons: ['location'] })}
              ><Icon name="map" size={18} /><span class="flex-1">Location</span
              >{#if task?.addons?.includes('location')}<span
                  class="text-xs text-gray-500">Added</span
                >{:else}<Icon name="plus" size={16} />{/if}</button
            >
          </section>
        </div>
      </details>{/if}
    {#if error}<p role="alert" class="mt-3 text-sm text-danger">{error}</p>{/if}
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
