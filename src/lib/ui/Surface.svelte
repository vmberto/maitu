<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  let { children, as = 'div', tone = 'default', class: className = '', ...attributes }: HTMLAttributes<HTMLElement> & {
    children: Snippet; as?: 'div' | 'section'; tone?: 'default' | 'danger';
  } = $props();
</script>

<svelte:element this={as} class={`ui-surface ${className}`} class:danger={tone === 'danger'} {...attributes}>{@render children()}</svelte:element>

<style>
  .ui-surface { min-width: 0; border: 1px solid rgb(var(--gray-200)); border-radius: var(--ui-surface-radius, 22px); background: rgb(var(--surface)); box-shadow: var(--ui-raised-shadow); }
  .danger { border-color: rgb(222 98 62 / .2); }
</style>
