<script lang="ts">
  import ListAppearance from '#lib/ListAppearance.svelte';
  import { flip } from 'svelte/animate';
  import Icon from '#lib/Icon.svelte';
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { sortable } from '#lib/reorder';
  import { HexColors } from '../lib/colors';
  import { engine, offline } from '#lib/offline';
  import { Colors } from '../../types/colors';
  import { ListType, type List } from '../../types/main';
  import { onMount, onDestroy } from 'svelte';
  import { lockBody } from '../lib/scroll-lock';
  import { setTheme } from '../lib/theme';
  let title = $state('');
  let type = $state<ListType>(ListType.tasks);
  let emoji = $state('📝');
  let color = $state(Colors.PRIMARY);
  let settingsId = $state<string | null>(null);
  const settingsList = $derived(
    $offline.account?.lists.find((item) => item._id === settingsId) as
      List | undefined,
  );
  let error = $state('');
  let menu: HTMLDialogElement;
  let newList: HTMLDialogElement;
  let newListUnlock: (() => void) | undefined;
  onDestroy(() => newListUnlock?.());
  let unlock: (() => void) | undefined;
  let dark = $state(false);
  onDestroy(() => unlock?.());
  onMount(() => {
    const update = () =>
      (dark = document.documentElement.classList.contains('dark'));
    update();
    window.addEventListener('maitu-theme-change', update);
    return () => window.removeEventListener('maitu-theme-change', update);
  });
  const lists = $derived(
    (
      $offline.account?.lists.filter(
        (item) => !item.deleted && !(item as List).archived,
      ) ?? []
    ).sort((a, b) => (a as List).index - (b as List).index) as List[],
  );
  async function addList(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await engine.add('lists', {
        title: title.trim(),
        id: '',
        emoji,
        color,
        index: lists.length,
        type,
        createdAt: new Date().toISOString(),
      } as List);
      title = '';
      error = '';
      closeDrawer(newList);
    } catch {
      error = 'Could not save this list on your device.';
    }
  }
</script>

<header class="sticky top-0 z-20 bg-gray-100">
  <div class="mx-auto flex h-12 max-w-xl items-center justify-between px-5">
    <h1 class="text-xl font-semibold text-primary">maitu</h1>
    <button
      aria-label="user-settings-menu"
      class="rubber-button rubber-icon text-primary"
      onclick={() => {
        menu.showModal();
        unlock = lockBody();
      }}><Icon name="menu" /></button
    >
  </div>
</header>
<main class="mx-auto max-w-xl space-y-3 p-5">
  <div
    class="space-y-3"
    use:sortable={{
      ids: lists.map((list) => String(list._id)),
      kind: 'lists',
      error: (message) => (error = message),
    }}
  >
    {#each lists as list (list._id)}<div
        animate:flip={{ duration: 180 }}
        data-sort-id={String(list._id)}
        title="Hold to reorder; use arrow keys when the row is focused"
        class="list-card relative flex items-center gap-3 rounded-md border-2 border-gray-200 bg-surface p-4 shadow-sm"
      >
        <button
          type="button"
          data-sort-key
          aria-label={`Reorder ${list.title}`}
          class="sr-only focus:not-sr-only"
          title="Use arrow keys to reorder">Reorder</button
        ><a
          href={`/${list.type === ListType.timeline ? 'timeline' : 'tasks'}?listId=${encodeURIComponent(String(list._id))}`}
          data-sveltekit-preload-code="viewport"
          class="list-card-link flex min-w-0 flex-1 items-center gap-3 font-medium"
          style:color={HexColors.get(list.color)}
          ><span class="text-4xl">{list.emoji}</span><span>{list.title}</span
          ></a
        ><button
          aria-label={`List settings ${list.title}`}
          class="rubber-button rubber-icon relative z-10 text-gray-500"
          onclick={() => (settingsId = String(list._id))}
          ><Icon name="dots" /></button
        >
      </div>{/each}
  </div>
  <button
    class="rubber-button mt-4 w-full text-primary"
    onclick={() => {
      newList.showModal();
      newListUnlock = lockBody();
    }}>New List</button
  >
  {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
</main>
<dialog
  use:drawerBehavior={'right'}
  bind:this={menu}
  oncancel={(event) => {
    event.preventDefault();
    closeDrawer(menu);
  }}
  onclose={() => {
    unlock?.();
    unlock = undefined;
  }}
  class="w-[calc(100%-2rem)] max-w-sm rounded-xl bg-surface p-5 text-gray-900 shadow-xl"
>
  <header data-drawer-header class="drawer-header">
    <h2>Account</h2>
    <button
      class="rubber-button rubber-icon float-right"
      aria-label="Close panel"
      onclick={() => closeDrawer(menu)}>×</button
    >
  </header>
  <div class="drawer-body">
    <div class="mb-6 text-center">
      <h3 class="text-lg font-semibold">{$offline.account?.user.username}</h3>
      <p class="text-sm text-gray-500">{$offline.account?.user.email}</p>
    </div>
    <div class="mt-5 space-y-3">
      <button
        class="rubber-button flex w-full items-center justify-between"
        role="switch"
        aria-label="Dark Mode"
        aria-checked={dark}
        onclick={() =>
          setTheme(
            document.documentElement.classList.contains('dark')
              ? 'light'
              : 'dark',
          )}
        ><span>Dark Mode</span><span
          class="relative inline-flex h-6 w-11 rounded-full transition-colors"
          style:background={dark ? '#3664ff' : 'rgb(var(--gray-300))'}
          ><span
            class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform"
            style:transform={dark ? 'translateX(20px)' : 'translateX(0)'}
          ></span></span
        ></button
      ><a href="/archived" class="rubber-button block w-full">Archived Lists</a
      ><button
        class="rubber-button block w-full"
        onclick={() => engine.signOut()}>Logout</button
      >
    </div>
  </div>
</dialog>

<dialog
  bind:this={newList}
  use:drawerBehavior
  oncancel={(event) => {
    event.preventDefault();
    closeDrawer(newList);
  }}
  onclose={() => {
    newListUnlock?.();
    newListUnlock = undefined;
  }}
  class="bg-surface text-gray-900"
>
  <header data-drawer-header class="drawer-header">
    <h2>New List</h2>
    <button
      class="rubber-button rubber-icon"
      aria-label="Close panel"
      onclick={() => closeDrawer(newList)}>×</button
    >
  </header>
  <div class="drawer-body">
    <form id="new-list-form" onsubmit={addList} class="flex items-end gap-3">
      <span class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-panel text-3xl">{emoji}</span>
      <label class="min-w-0 flex-1"
        ><span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Name</span><input
          bind:value={title}
          aria-label="List name"
          placeholder="Name your list"
          class="drawer-input"
          maxlength="30"
          required
        /></label
      >
    </form>
    <label class="mt-4 block text-sm"
      >List type<select
        aria-label="List type"
        bind:value={type}
        class="drawer-input mt-1"
        ><option value={ListType.tasks}>Tasks</option><option
          value={ListType.timeline}>Timeline</option
        ></select
      ></label
    >
    <ListAppearance
      {color}
      {emoji}
      onchange={(data) => {
        color = data.color ?? color;
        emoji = data.emoji ?? emoji;
      }}
    /><button
      form="new-list-form"
      type="submit"
      class="rubber-button rubber-primary mt-5 w-full">Add list</button
    >
  </div>
</dialog>
{#if settingsList}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    list={settingsList}
    close={() => (settingsId = null)}
  />{/await}{/if}

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
