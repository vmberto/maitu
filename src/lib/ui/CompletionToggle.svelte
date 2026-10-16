<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  let { class: className = '', type = 'button', ...attributes }: HTMLButtonAttributes = $props();
</script>

<button {type} class={`rubber-touch todo-check ${className}`} {...attributes}></button>

<style>
  button { background: rgb(var(--surface)); box-shadow: var(--ui-raised-shadow); }
  button:active:not(:disabled) { box-shadow: inset 0 1px 3px rgb(15 23 42 / .16); }
  button:focus { outline: none; }
</style>
