<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  let { children, class: className = '', type = 'button', variant = 'button', tone = 'default', icon = false, element = $bindable(), ...attributes }: HTMLButtonAttributes & { children?: Snippet; variant?: 'button' | 'row' | 'touch'; tone?: 'default' | 'primary' | 'danger' | 'success'; icon?: boolean; element?: HTMLButtonElement } = $props();
</script>

<button bind:this={element} {type} class={`${variant === 'row' ? 'rubber-touch option-row' : variant === 'touch' ? 'rubber-touch' : 'rubber-button'} ${tone === 'default' ? '' : `rubber-${tone}`} ${icon ? 'rubber-icon' : ''} ${className}`} {...attributes}>{@render children?.()}</button>

<style>
  .option-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; text-align: left; border-radius: 8px; }
  .option-row:not(:disabled):hover { background: rgb(var(--gray-200)); }
  .option-row:disabled { cursor: default; opacity: 0.5; }
</style>
