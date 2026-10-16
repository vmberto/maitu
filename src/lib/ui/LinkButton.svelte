<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  let { children, class: className = '', variant = 'button', icon = false, ...attributes }: HTMLAnchorAttributes & { children: Snippet; variant?: 'button' | 'touch'; icon?: boolean } = $props();
</script>

<a class={`${variant === 'touch' ? 'rubber-touch' : 'rubber-button'} ${icon ? 'rubber-icon' : ''} ${className}`} {...attributes}>{@render children()}</a>
