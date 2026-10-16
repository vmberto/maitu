<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import LinkButton from '#lib/ui/LinkButton.svelte';
  import { flip } from 'svelte/animate';
  import Icon from '#lib/ui/Icon.svelte';
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
  let newListOpen = $state(false);
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
  async function addList(data: Pick<List, 'title' | 'emoji' | 'color' | 'type'>) {
    await engine.add('lists', {
      ...data, id: '', index: lists.length, createdAt: new Date().toISOString(),
    } as List);
  }

</script>

<header class="sticky top-0 z-20 bg-gray-100">
  <div class="mx-auto flex h-12 max-w-xl items-center justify-between px-5">
    <h1 class="text-xl font-semibold text-primary">maitu</h1>
    <Button icon
      aria-label="user-settings-menu"
      class="text-primary"
      onclick={() => {
        menu.showModal();
        unlock = lockBody();
      }}><Icon name="menu" /></Button
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
          data-sveltekit-preload-code="hover"
          class="list-card-link flex min-w-0 flex-1 items-center gap-3 font-medium"
          style:color={HexColors.get(list.color)}
          ><span class="text-4xl">{list.emoji}</span><span>{list.title}</span
          ></a
        ><Button icon
          aria-label={`List settings ${list.title}`}
          class="relative z-10 text-gray-500"
          onclick={() => (settingsId = String(list._id))}
          ><Icon name="dots" /></Button
        >
      </div>{/each}
  </div>
  <Button
    class="mt-4 w-full text-primary"
    onclick={() => newListOpen = true}>New List</Button
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
    newListOpen = false;
    unlock?.();
    unlock = undefined;
  }}
  class="w-[calc(100%-2rem)] max-w-sm rounded-xl bg-surface p-5 text-gray-900 shadow-xl"
>
  <header data-drawer-header class="drawer-header">
    <h2>Account</h2>
    <Button icon
      class="float-right"
      aria-label="Close panel"
      onclick={() => closeDrawer(menu)}><Icon name="close" size={20} /></Button
    >
  </header>
  <div class="drawer-body">
    <div class="mb-6 text-center">
      <h3 class="text-lg font-semibold">{$offline.account?.user.username}</h3>
      <p class="text-sm text-gray-500">{$offline.account?.user.email}</p>
    </div>
    <div class="mt-5 space-y-3">
      <Button
        class="flex w-full items-center justify-between"
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
        ></Button
      ><LinkButton href="/archived/items" class="block w-full">Archived Items</LinkButton
      ><LinkButton href="/archived" class="block w-full">Archived Lists</LinkButton
      ><Button
        class="block w-full"
        onclick={() => engine.signOut()}>Logout</Button
      >
    </div>
  </div>
</dialog>

{#if newListOpen}{#await import('#lib/ui/NewListDialog.svelte') then module}{@const NewListDialog = module.default}<NewListDialog
  bind:title bind:type bind:emoji bind:color oncreate={addList} close={() => newListOpen = false}
/>{/await}{/if}
{#if settingsList}{#await import('#lib/ListDetails.svelte') then module}{@const ListDetails = module.default}<ListDetails
    list={settingsList}
    close={() => (settingsId = null)}
  />{/await}{/if}

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
