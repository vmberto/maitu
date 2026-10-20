<script lang="ts">
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { drawerBehavior, closeDrawer } from '../drawer';
  import { lockBody } from '../scroll-lock';
  let { oncreate, close }: { oncreate: (title: string) => Promise<void>; close: () => void } = $props();
  let dialog: HTMLDialogElement;
  let title = $state('');
  let error = $state('');
  let saving = $state(false);
  $effect(() => {
    dialog.showModal();
    return lockBody();
  });
</script>

<dialog use:drawerBehavior bind:this={dialog} oncancel={(event) => { event.preventDefault(); closeDrawer(dialog); }} onclose={close}
  class="list-editor text-gray-900">
  <header data-drawer-header class="drawer-header">
    <h2>New folder</h2>
    <Button icon aria-label="Close panel" onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></Button>
  </header>
  <form class="drawer-body space-y-4" onsubmit={async (event) => {
    event.preventDefault();
    if (!title.trim() || saving) return;
    saving = true;
    try {
      await oncreate(title.trim());
      closeDrawer(dialog);
    } catch {
      error = 'Could not save this folder on your device.';
    } finally { saving = false; }
  }}>
    <label class="block text-sm">Folder name<input class="drawer-input mt-2" bind:value={title} maxlength="50" required /></label>
    <Button tone="primary" type="submit" disabled={saving || !title.trim()} class="w-full">Create folder</Button>
    {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  </form>
</dialog>

<style>
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
</style>
