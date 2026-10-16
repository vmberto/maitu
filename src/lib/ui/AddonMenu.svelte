<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  let { name, onremove, disabled = false, reason = '', removeLabel = `Remove ${name}`, children }: {
    name: string; onremove: () => void | Promise<void>; disabled?: boolean; reason?: string; removeLabel?: string; children?: Snippet;
  } = $props();
  let menu: HTMLDetailsElement;
</script>

<!-- Safari focuses the containing dialog when a menu button is pressed. -->
<svelte:window onfocusin={(event) => { if (menu && !menu.contains(event.target as Node) && !(event.target as Node).contains(menu)) menu.open = false; }} onclick={(event) => { if (menu && !menu.contains(event.target as Node)) menu.open = false; }}
  onkeydown={(event) => {
    if (event.key === 'Escape' && menu?.open && menu.contains(event.target as Node)) { event.preventDefault(); event.stopPropagation(); menu.open = false; menu.querySelector('summary')?.focus(); }
  }} />
<details bind:this={menu} class="addon-menu">
  <summary aria-label={`${name} options`} class="rubber-button rubber-icon"><Icon name="dots" size={18} /></summary>
  <div class="menu-items">
    {#if children}{@render children()}{/if}
    <button class="rubber-button w-full text-left text-danger" {disabled} title={reason} onclick={async () => { const element = menu; await onremove(); element.open = false; }}>{removeLabel}</button>
  </div>
</details>

<style>
  .addon-menu { position: relative; flex-shrink: 0; }
  summary { cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  .menu-items { position: absolute; top: 100%; right: 0; z-index: 20; display: grid; gap: 4px; width: 220px; max-width: calc(100vw - 64px); margin-top: 4px; padding: 8px; border: 1px solid rgb(var(--gray-200)); border-radius: 10px; background: rgb(var(--surface)); box-shadow: 0 4px 16px #0002; }
</style>
