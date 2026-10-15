<script lang="ts">
  import AddonMenu from './ui/AddonMenu.svelte';
  import Section from './ui/Section.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import Tabs from './ui/Tabs.svelte';
  import Button from './ui/Button.svelte';
  import Disclosure from './ui/Disclosure.svelte';
  import TaskScheduling from './ui/TaskScheduling.svelte';
  import { autosize } from '#lib/autosize';
  import { HexColors } from './colors';
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { commitTaskTitle } from '#lib/task-title';
  import { engine, offline } from '#lib/offline';
  import { lockBody } from './scroll-lock';
  import { normalizeLocation, parseCoordinates } from './location';
  import type { List, Task, TaskLocation, TaskAddon } from '../../types/main';
  let {
    taskId,
    close,
    openItem,
    readonly = false,
  }: { taskId: string; close: () => void; openItem: (id: string) => void; readonly?: boolean } = $props();
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
  let coordinates = $state('');
  let searchInitialized = false;
  let results = $state<TaskLocation[]>([]);
  let searching = $state(false);
  let selectedPlace = $state<TaskLocation | null>(null);
  let locationTab = $state('search');
  let moving = $state(false);
  let destination = $state('');
  const task = $derived(
    $offline.account?.tasks.find((task) => task._id === taskId) as
      Task | undefined,
  );
  const ownerList = $derived($offline.account?.lists.find((item) => item._id === String(task?.listId)) as List | undefined);
  const mixed = $derived(ownerList?.type === 'mixed');
  const isNote = $derived(task?.type === 'note' || (['notes', 'timeline'].includes(ownerList?.type ?? '') && !task?.parentTaskId));
  const destinations = $derived(($offline.account?.lists ?? []).filter(
    (list) => !list.deleted && !(list as List).archived && ((list as List).type === 'mixed' || (!isNote && (list as List).type === 'tasks')) && String(list._id) !== String(task?.listId),
  ) as List[]);
  const detectedCoordinates = $derived(parseCoordinates(coordinates));
  let editLocation = $state(false);
  const children = $derived(
    ($offline.account?.tasks.filter(
      (item) => !item.deleted && String((item as Task).parentTaskId) === taskId,
    ) ?? []) as Task[],
  );
  const addons = $derived(Array.from(new Set([
    ...(task?.addons ?? []),
    ...(task?.schedule || task?.reminder ? ['scheduling' as const] : []),
    ...(children.length ? ['relatedTasks' as const] : []),
    ...(normalizeLocation(task?.location) ? ['location' as const] : []),
  ])));
  async function setAddon(addon: TaskAddon, enabled: boolean) {
    if (!enabled && addon === 'relatedTasks' && children.length) return;
    await save({ addons: enabled ? [...addons, addon] : addons.filter((item) => item !== addon),
      ...(!enabled && addon === 'scheduling' ? { schedule: null, reminder: null } : {}),
    });
  }
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
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
    if (task && !searchInitialized) {
      search = task.title;
      searchInitialized = true;
    }
  });
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
    if (!subtask.trim() || readonly || !task || addingSubtask || !addons.includes('relatedTasks')) return;
    addingSubtask = true;
    try {
      await engine.add('tasks', {
        title: subtask.trim(),
        description: '',
        complete: false,
        ...(mixed ? { type: 'task' as const } : {}),
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
        archived: false,
        complete: false,
        completedAt: null,
        reminder: null,
        createdAt: new Date().toISOString(),
      });
      for (const child of children) {
        const { _id, ...data } = child;
        await engine.add('tasks', {
          ...data,
          parentTaskId: cloned._id,
          complete: false,
          completedAt: null,
          reminder: null,
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
    if (searching) return;
    searching = true;
    error = '';
    results = [];
    selectedPlace = null;
    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(search.trim())}`,
        { signal: AbortSignal.timeout(12000) },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok || !body) throw new Error(body?.error || 'Place search is unavailable.');
      results = (body.places ?? [])
        .map(normalizeLocation)
        .filter((place: TaskLocation | null): place is TaskLocation => !!place);
      selectedPlace = results[0] ?? null;
      if (!results.length) error = 'No places found. Try adding the city or use Latitude / Longitude.';
    } catch (cause) {
      error = cause instanceof Error && cause.name !== 'TimeoutError' ? cause.message : 'Place search timed out. Try again or use Latitude / Longitude.';
    } finally {
      searching = false;
    }
  }
  async function saveLocation(event: SubmitEvent) {
    event.preventDefault();
    const value = locationTab === 'coordinates' ? detectedCoordinates : null;
    if (locationTab === 'search' && selectedPlace) {
      await save({ location: normalizeLocation(selectedPlace), addons: Array.from(new Set([...addons, 'location'])) });
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
      addons: Array.from(new Set([...addons, 'location'])),
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
        .map((item) => ({ kind: 'tasks', entityId: String(item._id), action: 'patch', data: { listId: destination, ...(String(item._id) === taskId && task?.parentTaskId ? { parentTaskId: null } : {}), index: saved.tasks.filter((task) => String((task as Task).listId) === destination).length } })));
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
  <div class="detail-scroll">
  <header data-drawer-header class="drawer-header">
    <div class="min-w-0 flex-1">
      <h2 class="mb-5 text-lg font-semibold">
        {#if readonly || task?.complete}{task?.title}{:else}<textarea
            rows="1"
            use:autosize={titleDraft ?? task?.title ?? ''}
            onblur={async (event) => {
              if (!task) return;
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
      <div class="task-dates mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-normal text-gray-500">
        {#if !isNote}{#if task?.complete}<p class="task-state-badge done">Completed <time datetime={task.completedAt ?? undefined}>{dateLabel(task.completedAt)}</time></p>{:else}<span class="task-state-badge">Open</span>{/if}{/if}
        {#if task?.archived}<span>Archived</span>{/if}
        <p><span class="task-date-label">Created</span> <time datetime={task?.createdAt}>{dateLabel(task?.createdAt)}</time></p>
      </div>
    </div>
    <button
      class="rubber-touch task-header-close"
      aria-label="Close panel"
      onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></button
    >
  </header>
  <div class="drawer-body">
    <Section>
      {#await import('./ui/RichTextEditor.svelte')}
        <p role="status" class="min-h-[72px] text-sm text-gray-500">Loading description…</p>
      {:then module}
        {@const RichTextEditor = module.default}
        <RichTextEditor value={descriptionDraft ?? task?.description ?? ''} {readonly}
          onchange={(value) => { descriptionDraft = value; void save({ description: value }); }} />
      {/await}
      <form class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3" onsubmit={addTag}>
        {#each Array.from(new Set(task?.tags ?? [])) as value (value)}<span
            class="inline-flex items-center gap-2 rounded-md bg-surface px-2 py-0.5 text-xs text-gray-700"
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
            class="min-w-0 flex-1 basis-24 border-0 bg-transparent px-0 py-1 text-xs"
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
    </Section>
    {#if task && !isNote && addons.includes('scheduling')}<TaskScheduling schedule={task.schedule} reminder={task.reminder}
      accountId={String($offline.account?.user._id ?? '')} readonly={readonly || task.complete}
      onremove={readonly ? undefined : () => void setAddon('scheduling', false)}
      onsave={(data) => engine.update('tasks', taskId, data).then(() => {})} />{/if}
    {#if addons.includes('relatedTasks')}<Section title="Related Tasks">
      {#snippet actions()}{#if !readonly}<AddonMenu name="Related Tasks" disabled={children.length > 0} reason={children.length ? 'Remove all related tasks first' : ''} onremove={() => setAddon('relatedTasks', false)} />{/if}{/snippet}
      <div class="related-rows">
        {#each children.filter((child) => !child.archived) as child (String(child._id))}<div
            class="task-row subtask-row flex items-start gap-2 rounded-md"
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
              class="todo-title subtask-title min-w-0 flex-1 resize-none border-0 bg-transparent"
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
            <button class="rubber-button rubber-icon" aria-label={`Task details ${child.title}`} onclick={() => openItem(String(child._id))}><Icon name="dots" /></button>
          </div>{/each}
      </div>
      {#if !readonly}<form
          class="task-row subtask-row mt-4 flex items-start gap-2"
          onsubmit={addSubtask}
        >
          <span class:todo-check={!isNote} class="shrink-0 p-0.5 text-primary opacity-50" aria-hidden="true">{#if isNote}<Icon name="plus" size={24} />{/if}</span><textarea
            aria-label="New subtask"
            placeholder="Add related task"
            bind:value={subtask}
            use:autosize={subtask}
            rows="1"
            class="todo-title subtask-title min-w-0 flex-1 resize-none border-0 bg-transparent"
            onblur={() => void addSubtask()}
            onkeydown={(event) => {
              if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                void addSubtask();
              }
            }}></textarea><button type="submit" class="sr-only">Add</button>
        </form>{:else if !children.length}<p class="text-sm text-gray-500">
          No related tasks
        </p>{/if}
    </Section>{/if}
    {#if task?.addons?.includes('location') || place}<Section title="Location">
        {#snippet actions()}
          {#if !readonly}<AddonMenu name="Location" removeLabel="Remove location" onremove={() => save({ addons: addons.filter((addon) => addon !== 'location'), location: null })}>
            <button class="rubber-button w-full text-left" onclick={async (event) => {
              const menu = event.currentTarget.closest('details');
              await save({ location: null });
              if (error) return;
              editLocation = true; locationTab = 'search'; search = task?.title ?? '';
              coordinates = ''; locationName = ''; results = []; selectedPlace = null;
              menu?.removeAttribute('open');
            }}>Change location</button>
          </AddonMenu>{/if}
        {/snippet}
        {#if place}<p class="mt-2">{place.name}</p>
          <p class="text-sm text-gray-500">
            {place.address || `${place.latitude}, ${place.longitude}`}
          </p>
          <a
            class="rubber-button mt-3 inline-block text-primary"
            href={`/tasks/map?listId=${encodeURIComponent(String(task?.listId))}&taskId=${taskId}`}
            >See on Map</a
          >{/if}
        {#if !readonly && (!place || editLocation)}
          <div class="mt-4"><Tabs label="Location entry method" value={locationTab} options={[{ value: 'search', label: 'Search Place' }, { value: 'coordinates', label: 'Latitude / Longitude' }]} onchange={(value) => { locationTab = value; error = ''; }} /></div>
          <div role="tabpanel" aria-label={locationTab === 'search' ? 'Search Place' : 'Latitude / Longitude'}>
          {#if locationTab === 'search'}<form
            onsubmit={searchPlaces}
            class="mt-3 flex gap-3"
          >
            <input
              aria-label="Search places"
              bind:value={search}
              oninput={() => { selectedPlace = null; results = []; }}
              placeholder="Place name and city"
              class="location-search drawer-input min-w-0 flex-1"
              minlength="3"
              maxlength="200"
              required
            /><Button type="submit" disabled={searching}
              >{searching ? 'Searching…' : 'Search'}</Button
            >
          </form>
          {#if results.length}<div class="location-results mt-3 overflow-hidden rounded-lg border border-gray-200">
          {#each results as result (result.placeId)}<button
              class="location-result block w-full border-b border-gray-200 px-3 py-3 text-left last:border-0"
              aria-pressed={selectedPlace?.placeId === result.placeId}
              onclick={() => { selectedPlace = result; coordinates = ''; }}
              >{result.name}<span class="block text-xs text-gray-500"
                >{result.address}</span
              ></button
            >{/each}</div>{/if}{/if}
          <form onsubmit={saveLocation} class="mt-4">
            {#if locationTab === 'coordinates'}
              <input aria-label="Coordinates" bind:value={coordinates} oninput={() => selectedPlace = null} placeholder="0.0000, 0.0000" class="location-search drawer-input mb-3" />
            {#if detectedCoordinates}<p class="mb-3 text-sm text-gray-500">Latitude {detectedCoordinates.latitude}, longitude {detectedCoordinates.longitude}</p>{/if}{/if}
            <Button type="submit" disabled={locationTab === 'coordinates' ? !detectedCoordinates : !selectedPlace} class="text-sm text-primary">Save location</Button>
          </form></div>{/if}
      </Section>{/if}
    {#if !readonly}<Disclosure title="Options" class="task-options">
        <div class="entry-actions">
          <Section title="Actions">
            {#if mixed && !task?.parentTaskId}<Button variant="row" onclick={async () => { await save({ type: isNote ? 'task' : 'note', complete: false, completedAt: null, archived: false }); }}><Icon name="note" size={18} /><span>{isNote ? 'Convert to task' : 'Convert to note'}</span></Button>{/if}
            <Button variant="row" onclick={async () => { await save({ archived: !task?.archived }); if (!error) closeDrawer(dialog); }}><Icon name="archive" size={18} /><span>{task?.archived ? (isNote ? 'Restore note' : 'Restore task') : (isNote ? 'Archive note' : 'Archive task')}</span></Button>
            <Button variant="row" onclick={() => moving = !moving}><Icon name="back" size={18} /><span>{isNote ? 'Move Note' : 'Move Task'}</span></Button>
            {#if moving}<form onsubmit={moveTask} class="my-2 space-y-2">
              <select aria-label="Destination list" bind:value={destination} class="drawer-input"><option value="">Choose a tasks list</option>{#each destinations as list (list._id)}<option value={String(list._id)}>{list.emoji} {list.title}</option>{/each}</select>
              <button class="rubber-button rubber-primary w-full" disabled={!destination}>Move task</button>
            </form>{/if}
            <Button variant="row" onclick={clone}
              ><Icon name="clone" size={18} /><span>{isNote ? 'Clone Note' : 'Clone Task'}</span></Button><Button variant="row" class="text-danger"
              onclick={async () => {
                try {
                  await engine.remove('tasks', taskId);
                  closeDrawer(dialog);
                } catch {
                  error = 'Could not delete this task.';
                }
              }}><Icon name="trash" size={18} /><span>{isNote ? 'Delete Note' : 'Delete Task'}</span></Button>
          </Section>
          <Section title="Add-ons">
            {#if !isNote}<Button variant="row" disabled={addons.includes('scheduling')} onclick={() => void setAddon('scheduling', true)}>
              <Icon name="calendar" size={18} /><span class="flex-1">Schedule &amp; Reminder</span>
              {#if addons.includes('scheduling')}<span class="text-xs text-gray-500">Added</span>{:else}<Icon name="plus" size={16} />{/if}
            </Button>{/if}
            <Button variant="row"
              disabled={addons.includes('location')}
              onclick={() => void setAddon('location', true)}
              ><Icon name="map" size={18} /><span class="flex-1">Location</span
              >{#if addons.includes('location')}<span
                  class="text-xs text-gray-500">Added</span
                >{:else}<Icon name="plus" size={16} />{/if}</Button>
            <Button variant="row" disabled={addons.includes('relatedTasks')} onclick={() => void setAddon('relatedTasks', true)}>
              <Icon name="menu" size={18} /><span class="flex-1">Related Tasks</span>
              {#if addons.includes('relatedTasks')}<span class="text-xs text-gray-500">Added</span>{:else}<Icon name="plus" size={16} />{/if}
            </Button>
          </Section>
        </div>
      </Disclosure>{/if}
    {#if error}<p role="alert" class="mt-3 text-sm text-danger">{error}</p>{/if}
  </div>
  </div>
</dialog>

<style>
  .detail-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  .task-drawer :global(.drawer-header) { display: block; position: relative; padding: 16px 64px 16px 20px; border-bottom: 0; touch-action: pan-y; }
  .task-drawer :global(.drawer-header textarea) { padding: 0; font: inherit; }
  .task-drawer :global(.task-header-close) { position: absolute; top: 14px; right: 16px; }
  .task-drawer h2 { margin: 0 0 8px; font-size: 22px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
  .task-drawer :global(.drawer-body) { display: flex; flex-direction: column; gap: 16px; overflow: visible; padding: 8px 20px calc(112px + env(safe-area-inset-bottom)); }
  .task-drawer :global(.subtask-row) { margin: 0; border-bottom: 0; padding: 8px 0; border-radius: 0; }
  .entry-actions { display: flex; flex-direction: column; gap: 16px; }
  .task-drawer :global(.drawer-body form > span.inline-flex) { background: rgb(54 100 255 / 10%); border-radius: 999px; }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  @media (max-width: 480px) {
    .task-drawer :global(.drawer-header) { padding: 16px 60px 12px 16px; }
    .task-drawer :global(.drawer-body) { padding: 8px 16px calc(112px + env(safe-area-inset-bottom)); }
    .task-drawer :global(.task-header-close) { top: 14px; right: 14px; }
    .task-drawer h2 { font-size: 21px; }
  }
</style>
