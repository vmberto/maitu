<script lang="ts">
  import type { Snippet } from 'svelte';
  let { options, value, onchange, isDisabled = () => false, icon }: {
    options: { value: string; label: string; accessibleLabel?: string }[];
    value: string; onchange: (value: string) => void;
    isDisabled?: (value: string) => boolean; icon?: Snippet<[string]>;
  } = $props();
  const id = $props.id();
</script>

<div class="type-grid">
  {#each options as option (option.value)}
    {@const disabled = isDisabled(option.value)}
    <label title={option.accessibleLabel ?? option.label}>
      <input aria-label={option.accessibleLabel ?? option.label} class="tile-input" type="radio" name={`${id}-choice`} value={option.value} checked={value === option.value} {disabled} onchange={() => onchange(option.value)} />
      <span class="type-tile text-gray-600" class:selected={value === option.value} class:unavailable={disabled}>
        {#if icon}{@render icon(option.value)}{/if}
        <span class="tile-label">{option.label}</span>
      </span>
    </label>
  {/each}
</div>

<style>
  .type-grid { clear: both; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 3px; padding: 3px; border-radius: 16px; background: rgb(var(--gray-100)); }
  label { position: relative; min-width: 0; }
  .tile-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; z-index: 1; cursor: pointer; }
  .tile-input:disabled { cursor: not-allowed; }
  .type-tile { display: flex; min-height: 42px; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 3px 2px; border: 1px solid transparent; border-radius: 12px; transition: background 150ms, box-shadow 150ms; }
  .tile-label { text-align: center; font-size: 11px; font-weight: 500; line-height: 1.3; }
  label:hover .type-tile:not(.unavailable) { color: rgb(var(--gray-900)); }
  .type-tile.selected { border-color: rgb(var(--gray-200)); color: rgb(var(--gray-900)); background: rgb(var(--surface)); box-shadow: var(--ui-selected-shadow); }
  .type-tile.unavailable { opacity: .4; cursor: not-allowed; }
  @media (prefers-reduced-motion: reduce) { .type-tile { transition: none; } }
</style>
