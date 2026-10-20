<script lang="ts">
  import ListIdentity from '#lib/ui/ListIdentity.svelte';
  import Button from '#lib/ui/Button.svelte';
  import Surface from './ui/Surface.svelte';
  import Icon from './ui/Icon.svelte';
  import { HexColors } from './colors';
  import ListTypePicker from '#lib/ui/ListTypePicker.svelte';
  import ListAppearance from '#lib/ui/ListAppearance.svelte';
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { engine, offline } from '#lib/offline';
  import { lockBody } from './scroll-lock';
  import type { List, Task } from '../../types/main';
  import { listTypeError } from './list-types';
  import { goto } from '$app/navigation';
  let { list, close }: { list: List; close: () => void } = $props();
  let dialog: HTMLDialogElement;
  let error = $state('');
  let confirmation = $state('');
  const items = $derived(($offline.account?.tasks ?? []).filter((item) => !item.deleted && String((item as Task).listId) === String(list._id)) as Task[]);
  async function changeType(type: List['type']) {
    await save({ type });
    if (error) return;
    await goto(`/${type === 'timeline' ? 'timeline' : 'tasks'}?listId=${encodeURIComponent(String(list._id))}`);
  }
  $effect(() => {
    dialog?.showModal();
    return lockBody();
  });
  async function save(data: Partial<List>) {
    try {
      await engine.update('lists', String(list._id), data);
      error = '';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not save this list.';
    }
  }
</script>

<dialog
  use:drawerBehavior
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    closeDrawer(dialog);
  }}
  onclose={close}
  class="list-editor text-gray-900"
  style={`--editor-accent: ${HexColors.get(list.color)}`}
>
  <header data-drawer-header class="drawer-header">
    <h2 class="mb-5 font-semibold">Edit list</h2>
    <Button icon
      class="float-right"
      aria-label="Close panel"
      onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></Button
    >
  </header>
  <div class="drawer-body">
    {#if list.archived}<p>Archived · Read only</p>
      <h3>{list.title}</h3>{:else}<ListIdentity emoji={list.emoji}><label class="min-w-0 flex-1"
        ><input
          aria-label="List title"
          value={list.title}
          class="list-name-input"
          oninput={(event) => void save({ title: event.currentTarget.value })}
        /></label
      ></ListIdentity>
      <Surface class="list-options"><ListTypePicker value={list.type} onchange={(type) => void changeType(type)} isDisabled={(type) => type === 'timeline' || !!listTypeError(items, list.type, type)} />
      <ListAppearance color={list.color} emoji={list.emoji} onchange={save} /></Surface>
      <label class="mt-4 block text-sm">Folder
        <select aria-label="List folder" class="drawer-input mt-2" value={list.folderId ?? ''}
          onchange={(event) => void save({ folderId: event.currentTarget.value || null })}>
          <option value="">No folder</option>
          {#each ($offline.account?.folders ?? []).filter((folder) => !folder.deleted) as folder}
            <option value={folder._id}>{folder.title}</option>
          {/each}
        </select>
      </label>
      <Button tone="primary" class="list-primary" onclick={() => closeDrawer(dialog)}>Save changes</Button>
      <Button
        class="list-archive"
        onclick={async () => {
          await save({ archived: true });
          if (!error) closeDrawer(dialog);
        }}><Icon name="archive" size={20} />Archive list</Button
      >
      <Surface as="section" tone="danger" class="list-delete" aria-label="Delete list">
        <h3 class="text-sm font-semibold text-danger">Delete list</h3>
        <p class="list-delete-description">This permanently deletes the list and its {items.length} {items.length === 1 ? 'item' : 'items'}. This can’t be undone.</p>
        <form
          class="mt-3 space-y-3"
          onsubmit={async (event) => {
            event.preventDefault();
            if (confirmation !== list.title) return;
            try {
              await engine.remove('lists', String(list._id));
              window.location.assign('/');
            } catch {
              error = 'Could not delete this list.';
            }
          }}
        >
          <label class="block text-sm"
            >Type the list name to delete it<input
              aria-label="Confirm list name"
              bind:value={confirmation}
              class="drawer-input mt-1"
            /></label
          ><Button tone="danger" type="submit"
            class="list-primary"
            disabled={confirmation !== list.title}
            >Delete list permanently</Button
          >
        </form>
      </Surface>{/if}
    {#if error}<p role="alert" class="mt-3 text-danger">{error}</p>{/if}
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
