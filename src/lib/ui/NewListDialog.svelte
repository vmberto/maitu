<script lang="ts">
  import type { List } from '../../../types/main';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import Surface from './Surface.svelte';
  import ListIdentity from './ListIdentity.svelte';
  import ListTypePicker from './ListTypePicker.svelte';
  import ListAppearance from './ListAppearance.svelte';
  import { HexColors } from '../colors';
  import { drawerBehavior, closeDrawer } from '../drawer';
  import { lockBody } from '../scroll-lock';
  let { title = $bindable(), type = $bindable(), emoji = $bindable(), color = $bindable(), oncreate, close }: Pick<List, 'title' | 'type' | 'emoji' | 'color'> & {
    oncreate: (data: Pick<List, 'title' | 'type' | 'emoji' | 'color'>) => Promise<void>;
    close: () => void;
  } = $props();
  let dialog: HTMLDialogElement;
  let error = $state('');
  $effect(() => {
    dialog.showModal();
    return lockBody();
  });
  async function create(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await oncreate({ title: title.trim(), type, emoji, color });
      title = '';
      error = '';
      closeDrawer(dialog);
    } catch {
      error = 'Could not save this list on your device.';
    }
  }
</script>

<dialog use:drawerBehavior bind:this={dialog} oncancel={(event) => { event.preventDefault(); closeDrawer(dialog); }} onclose={close}
  class="list-editor text-gray-900" style={`--editor-accent: ${HexColors.get(color)}`}>
  <header data-drawer-header class="drawer-header">
    <h2>New List</h2>
    <Button icon aria-label="Close panel" onclick={() => closeDrawer(dialog)}><Icon name="close" size={20} /></Button>
  </header>
  <div class="drawer-body">
    <form id="new-list-form" onsubmit={create}>
      <ListIdentity {emoji}>
        <label class="min-w-0 flex-1"><input bind:value={title} aria-label="List name" placeholder="Name your list" class="list-name-input" maxlength="30" required /></label>
      </ListIdentity>
    </form>
    <Surface class="list-options">
      <ListTypePicker value={type} onchange={(value) => type = value} />
      <ListAppearance {color} {emoji} onchange={(data) => { color = data.color ?? color; emoji = data.emoji ?? emoji; }} />
    </Surface>
    {#if error}<p role="alert" class="mt-3 text-danger">{error}</p>{/if}
  </div>
  <footer class="list-create-footer"><Button tone="primary" form="new-list-form" type="submit" class="list-primary">Create list</Button></footer>
</dialog>

<style>
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
</style>
