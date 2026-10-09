<script lang="ts">
  import ListAppearance from '#lib/ListAppearance.svelte';
  import { drawerBehavior, closeDrawer } from '#lib/drawer';
  import { engine } from '#lib/offline';
  import { lockBody } from './scroll-lock';
  import type { List } from '../../types/main';
  let { list, close }: { list: List; close: () => void } = $props();
  let dialog: HTMLDialogElement;
  let error = $state('');
  let confirmation = $state('');
  $effect(() => {
    dialog?.showModal();
    return lockBody();
  });
  async function save(data: Partial<List>) {
    try {
      await engine.update('lists', String(list._id), data);
      error = '';
    } catch {
      error = 'Could not save this list.';
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
  class="w-[calc(100%-1rem)] max-w-xl rounded-xl bg-surface p-5 text-gray-900"
>
  <header data-drawer-header class="drawer-header">
    <h2 class="mb-5 font-semibold">List settings</h2>
    <button
      class="rubber-button rubber-icon float-right"
      aria-label="Close panel"
      onclick={() => closeDrawer(dialog)}>×</button
    >
  </header>
  <div class="drawer-body">
    {#if list.archived}<p>Archived · Read only</p>
      <h3>{list.title}</h3>{:else}<div class="flex items-end gap-3"><span class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-panel text-3xl">{list.emoji}</span><label class="min-w-0 flex-1"
        ><span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Name</span><input
          aria-label="List title"
          value={list.title}
          class="drawer-input"
          oninput={(event) => void save({ title: event.currentTarget.value })}
        /></label
      ></div>
      <ListAppearance color={list.color} emoji={list.emoji} onchange={save} />
      <button
        class="rubber-button mt-5 text-danger"
        onclick={async () => {
          await save({ archived: true });
          if (!error) closeDrawer(dialog);
        }}>Archive list</button
      >
      <details class="mt-5">
        <summary class="cursor-pointer text-sm text-danger">Delete list</summary
        >
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
          ><button
            class="rubber-button text-danger"
            disabled={confirmation !== list.title}
            >Delete list permanently</button
          >
        </form>
      </details><button class="rubber-button rubber-primary mt-5 w-full py-3" onclick={() => closeDrawer(dialog)}>Done</button>{/if}
    {#if error}<p role="alert" class="mt-3 text-danger">{error}</p>{/if}
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
</style>
