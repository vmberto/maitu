<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { tick } from 'svelte';
  import { HexColors } from '#lib/colors';
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
  let messages = $state<HTMLDivElement | undefined>();
  let sentinel = $state<HTMLButtonElement | undefined>();
  $effect(() => { listId; visible = 20; });
  $effect(() => {
    const batch = visible;
    if (!sentinel || !messages || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        visible = batch + 20;
      }
    }, { root: messages, rootMargin: '200px 0px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  });
  const days = $derived.by(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, visible).reverse()) {
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
      await tick();
      messages?.scrollTo({ top: 0 });
    } catch {
      error = 'Could not save this entry.';
    }
  }
</script>

<ListHeader {list} settings={() => (settings = true)} />
<main class="timeline-chat mx-auto flex max-w-xl flex-col" style:--list-color={HexColors.get(list?.color ?? 'primary')}>
  {#if !list}<p class="p-5">This list is unavailable on this device.</p>{:else}
    {#if list.archived}<p class="px-5 py-2 text-sm text-gray-500">Archived · Read only</p>{/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable history must be keyboard accessible.) -->
    <div bind:this={messages} class="chat-history min-h-0 flex-1" role="region" aria-label="Timeline messages" tabindex="0">
      <div class="chat-entries space-y-6">
        {#if visible < tasks.length}<Button bind:element={sentinel} class="w-full text-sm text-gray-500" onclick={() => visible += 20}>Older entries</Button>{/if}
        {#each days as [day, entries] (day)}<section>
          <h2 class="mb-4 text-center text-xs font-medium text-gray-500">
            {new Date(`${day}T12:00:00`).toLocaleDateString()}
          </h2>
          <div class="space-y-3">
            {#each entries as task (String(task._id))}<article class="chat-message ml-auto w-fit max-w-[90%]">
              <p class="whitespace-pre-wrap break-words leading-relaxed">{task.title}</p>
              <time class="mt-1 block text-right text-xs text-gray-500" datetime={task.createdAt}>
                {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </article>{/each}
          </div>
        </section>{/each}
      </div>
    </div>
    {#if error}<p role="alert" class="px-5 text-danger">{error}</p>{/if}
    {#if !list.archived}<div class="chat-composer shrink-0">
      <form onsubmit={add} class="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-100 p-3">
        <textarea aria-label="New entry" bind:value={draft} placeholder="what's up?" use:autosize={draft}
          class="todo-title min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent" rows="1"></textarea>
        <Button icon tone="primary" type="submit" aria-label="Add entry"><span aria-hidden="true">→</span></Button>
      </form>
    </div>{/if}
  {/if}
</main>
{#if settings && list}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    {list}
    close={() => (settings = false)}
  />{/await}{/if}

<style>
  .timeline-chat { height: calc(100dvh - 3rem); }
  .chat-history { display: flex; flex-direction: column-reverse; overflow-y: auto; overscroll-behavior: contain; padding: 20px; }
  .chat-entries { flex-shrink: 0; }
  .chat-message { padding: 12px 16px 8px; border-radius: 18px 18px 5px 18px; background: color-mix(in srgb, var(--list-color) 9%, rgb(var(--surface))); }
  .chat-composer { padding: 12px 20px max(24px, env(safe-area-inset-bottom)); }
  .chat-composer form { box-shadow: var(--ui-raised-shadow); }
  .chat-composer textarea { max-height: 30dvh; }
</style>
