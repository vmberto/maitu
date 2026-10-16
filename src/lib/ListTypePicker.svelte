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
    { type: ListType.places, label: 'Places List', path: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0' },
    { type: ListType.timeline, label: 'Timeline', path: 'M6 3v18M11 5h9M11 12h6M11 19h9' },
  ];
</script>

<fieldset class="list-type-section">
  <legend class="list-field-label"><span aria-hidden="true">Type</span><span class="sr-only">List type</span></legend>
  <div class="type-grid">
    {#each options as option (option.type)}
      {@const disabled = isDisabled(option.type)}
      <label title={option.label}>
        <input aria-label={option.label} class="tile-input" type="radio" name={`${id}-list-type`} value={option.type} checked={value === option.type} disabled={disabled} onchange={() => onchange(option.type)} />
        <span class="type-tile text-gray-600" class:selected={value === option.type} class:unavailable={disabled}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d={option.path} />
            {#if option.type === ListType.timeline}<circle cx="6" cy="5" r="2" fill="currentColor" /><circle cx="6" cy="12" r="2" fill="currentColor" /><circle cx="6" cy="19" r="2" fill="currentColor" />{/if}
          </svg>
          <span class="tile-label">{option.type === ListType.mixed ? 'Both' : option.type === ListType.places ? 'Places' : option.label}</span><span class="sr-only">{option.label}</span>
        </span>
      </label>
    {/each}
  </div>
  <p class="type-description">{({ tasks: 'A simple checklist you can tick off.', notes: 'A space to collect your thoughts and ideas.', mixed: 'Tasks and notes, together in one list.', places: 'Save places and explore them on a map.', timeline: 'Keep your entries in chronological order.' })[value]}</p>
</fieldset>

<style>
  fieldset { min-width: 0; padding: 20px; }
  legend { float: left; width: 100%; margin-bottom: 14px; }
  .type-grid { clear: both; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px; padding: 4px; border-radius: 16px; background: rgb(var(--gray-100)); }
  label { position: relative; min-width: 0; }
  .tile-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; z-index: 1; cursor: pointer; }
  .tile-input:disabled { cursor: not-allowed; }
  .type-tile { display: flex; min-height: 74px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 8px 2px; border: 1px solid transparent; border-radius: 12px; transition: background 150ms, box-shadow 150ms; }
  .tile-label { text-align: center; font-size: 13px; font-weight: 500; line-height: 1.3; }
  label:hover .type-tile:not(.unavailable) { color: rgb(var(--gray-900)); }
  .type-tile.selected { border-color: rgb(var(--gray-200)); color: rgb(var(--gray-900)); background: rgb(var(--surface)); box-shadow: inset 0 1px 0 rgb(255 255 255 / .7), 1px 2px 3px rgb(15 23 42 / .15), 3px 0 0 rgb(15 23 42 / .04); }
  .type-description { margin-top: 14px; color: rgb(var(--gray-500)); font-size: 14px; line-height: 1.5; }
  .type-tile.unavailable { opacity: .4; cursor: not-allowed; }
  input:focus-visible + .type-tile { outline: 2px solid #3664ff; outline-offset: 2px; }
  @media (max-width: 360px) { fieldset { padding: 16px 12px; } .tile-label { font-size: 11px; } }
  @media (prefers-reduced-motion: reduce) { .type-tile { transition: none; } }
</style>
