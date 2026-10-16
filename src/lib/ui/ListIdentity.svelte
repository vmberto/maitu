<script lang="ts">
  import type { Snippet } from 'svelte';
  let { emoji, children }: { emoji: string; children: Snippet } = $props();
</script>

<div class="list-identity"><span class="list-avatar">{emoji}</span>{@render children()}</div>

<style>
  .list-identity { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; }
  .list-avatar { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; flex-shrink: 0; border: 1px solid color-mix(in srgb, var(--editor-accent) 12%, transparent); border-radius: 21px; font-size: 28px; background: color-mix(in srgb, var(--editor-accent) 10%, rgb(var(--surface))); box-shadow: var(--ui-raised-shadow); }
</style>
