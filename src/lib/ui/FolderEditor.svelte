<script lang="ts">
  import { onMount } from 'svelte';
  import type { Folder } from '../../../types/main';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { drawerBehavior, closeDrawer } from '../drawer';
  import { lockBody } from '../scroll-lock';
  let { folder, onsave, ondelete, close }: {
    folder?: Folder; onsave: (title: string) => Promise<unknown>; ondelete?: () => Promise<void>; close: () => void;
  } = $props();
  let dialog: HTMLDialogElement;
  let title = $state('');
  let error = $state('');
  let saving = $state(false);
  onMount(() => {
    title = folder?.title ?? '';
    dialog.showModal();
    return lockBody();
  });
  async function run(action: () => Promise<unknown>) {
    if (saving) return;
    saving = true;
    try {
      await action();
      closeDrawer(dialog);
    } catch {
      error = 'Could not update this folder on your device.';
    } finally { saving = false; }
  }
</script>

<dialog use:drawerBehavior bind:this={dialog} oncancel={(event) => { event.preventDefault(); closeDrawer(dialog); }} onclose={close}
  class="list-editor text-gray-900">
  <header data-drawer-header class="drawer-header">
    <h2>{ondelete ? 'Edit folder' : 'New folder'}</h2>
    <Button icon aria-label="Close panel" onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></Button>
  </header>
  <form class="drawer-body space-y-4" onsubmit={(event) => {
    event.preventDefault();
    if (title.trim()) void run(() => onsave(title.trim()));
  }}>
    <label class="block text-sm">Folder name<input class="drawer-input mt-2" bind:value={title} maxlength="50" required /></label>
    <Button tone="primary" type="submit" disabled={saving || !title.trim()} class="w-full">{ondelete ? 'Save changes' : 'Create folder'}</Button>
    {#if ondelete}
      <p class="text-sm text-gray-500">Deleting this folder keeps its lists under “No folder”.</p>
      <Button tone="danger" disabled={saving} class="w-full" onclick={() => run(ondelete!)}>Delete folder</Button>
    {/if}
    {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  </form>
</dialog>

<style>
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
</style>
