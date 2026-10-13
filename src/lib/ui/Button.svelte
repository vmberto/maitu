<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  let { children, class: className = '', type = 'button', variant = 'button', ...attributes }: HTMLButtonAttributes & { children: Snippet; variant?: 'button' | 'row' } = $props();
</script>

<button {type} class={`${variant === 'row' ? 'rubber-touch option-row' : 'rubber-button'} ${className}`} {...attributes}>{@render children()}</button>

<style>
  .option-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; text-align: left; border-radius: 8px; }
  .option-row:not(:disabled):hover { background: rgb(var(--gray-200)); }
  .option-row:disabled { cursor: default; opacity: 0.5; }
</style>
