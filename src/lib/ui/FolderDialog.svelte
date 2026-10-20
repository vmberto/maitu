<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { drawerBehavior, closeDrawer } from '../drawer';
  import { lockBody } from '../scroll-lock';
  import { sortable } from '../reorder';
  let { title, ids, orderIds, children, close, oncreate }: {
    title: string; ids: string[]; orderIds: string[]; children: Snippet;
    close: () => void; oncreate: () => void;
  } = $props();
  let dialog: HTMLDialogElement;
  let error = $state('');
  $effect(() => {
    dialog.showModal();
    return lockBody();
  });
</script>

<dialog use:drawerBehavior bind:this={dialog} oncancel={(event) => { event.preventDefault(); closeDrawer(dialog); }} onclose={close}
  class="list-editor text-gray-900" aria-label={title}>
  <header data-drawer-header class="drawer-header">
    <h2>{title}</h2>
    <Button icon aria-label="Close folder" onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></Button>
  </header>
  <div class="drawer-body" use:sortable={{ ids, orderIds, kind: 'lists', error: (message) => error = message }}>
    {@render children()}
    {#if !ids.length}<p class="py-6 text-center text-sm text-gray-500">This folder is empty. Drag lists onto its badge, or create a list here.</p>{/if}
    {#if error}<p role="alert" class="mt-3 text-sm text-danger">{error}</p>{/if}
    <Button class="mt-4 w-full text-primary" onclick={oncreate}>New List</Button>
  </div>
</dialog>

<style>
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
</style>
