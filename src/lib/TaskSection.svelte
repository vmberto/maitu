<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, actions, children }: { title?: string; actions?: Snippet; children: Snippet } = $props();
</script>

<section>
  {#if title}<header><h3>{title}</h3>{#if actions}{@render actions()}{/if}</header>{/if}
  {@render children()}
</section>

<style>
  section { min-width: 0; padding: 16px; background: rgb(var(--panel)); border-radius: 12px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  h3 { margin: 0; color: rgb(var(--gray-900)); font-size: 16px; font-weight: 600; line-height: 1.5; }
</style>
