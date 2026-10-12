<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  let { children, class: className = '', type = 'button', ...attributes }: HTMLButtonAttributes & { children: Snippet } = $props();
</script>

<button {type} class={`rubber-button ${className}`} {...attributes}>{@render children()}</button>
