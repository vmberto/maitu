<script lang="ts">
  import { ListType } from '../../types/main';
  let { value, onchange, isDisabled = () => false }: {
    value: ListType; onchange: (type: ListType) => void; isDisabled?: (type: ListType) => boolean;
  } = $props();
  const id = $props.id();
  const options = [
    { type: ListType.tasks, label: 'Tasks', path: 'm4 7 2 2 4-4M13 7h7M4 15l2 2 4-4M13 15h7' },
    { type: ListType.notes, label: 'Notes', path: 'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6' },
    { type: ListType.mixed, label: 'Tasks & Notes', path: 'm3 6 2 2 3-3M11 6h10M3 12h18M3 17h12M3 21h8' },
    { type: ListType.timeline, label: 'Timeline', path: 'M6 3v18M11 5h9M11 12h6M11 19h9' },
  ];
</script>

<fieldset class="mt-5">
  <legend class="mb-3 text-sm">List type</legend>
  <div class="type-grid">
    {#each options as option (option.type)}
      {@const disabled = isDisabled(option.type)}
      <label title={option.label}>
        <input class="tile-input" type="radio" name={`${id}-list-type`} value={option.type} checked={value === option.type} disabled={disabled} onchange={() => onchange(option.type)} />
        <span class="type-tile text-gray-600" class:selected={value === option.type} class:unavailable={disabled}>
          <span class="selection-dot" aria-hidden="true"></span>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d={option.path} />
            {#if option.type === ListType.timeline}<circle cx="6" cy="5" r="2" fill="currentColor" /><circle cx="6" cy="12" r="2" fill="currentColor" /><circle cx="6" cy="19" r="2" fill="currentColor" />{/if}
          </svg>
          <span class="tile-label">{option.label}</span>
        </span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .type-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  label { position: relative; }
  .tile-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; z-index: 1; cursor: pointer; }
  .tile-input:disabled { cursor: not-allowed; }
  .type-tile { position: relative; display: flex; aspect-ratio: 1; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 12px; border: 1px solid rgb(var(--panel)); border-radius: 14px; background: rgb(var(--panel)); cursor: pointer; transition: border-color 150ms, color 150ms; }
  .tile-label { text-align: center; font-size: 12px; font-weight: 600; line-height: 1.3; }
  label:hover .type-tile:not(.unavailable) { border-color: #3664ff; }
  .type-tile.selected { border-color: #3664ff; color: #3664ff; background: rgb(54 100 255 / .07); }
  .selection-dot { position: absolute; top: 10px; right: 10px; width: 6px; height: 6px; border-radius: 50%; background: transparent; }
  .selected .selection-dot { background: currentColor; }
  .type-tile.unavailable { opacity: .4; cursor: not-allowed; }
  input:focus-visible + .type-tile { outline: 2px solid #3664ff; outline-offset: 3px; }
  @media (max-width: 460px) { .type-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .tile-label { font-size: 14px; } }
  @media (prefers-reduced-motion: reduce) { .type-tile { transition: none; } }
</style>
