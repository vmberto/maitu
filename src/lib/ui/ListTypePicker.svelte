<script lang="ts">
  import ChoiceGroup from './ChoiceGroup.svelte';
  import { ListType } from '../../../types/main';
  let { value, onchange, isDisabled = () => false }: {
    value: ListType; onchange: (type: ListType) => void; isDisabled?: (type: ListType) => boolean;
  } = $props();
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
  <ChoiceGroup options={options.map((option) => ({ value: option.type, label: option.type === ListType.mixed ? 'Both' : option.type === ListType.places ? 'Places' : option.label, accessibleLabel: option.label }))}
    {value} onchange={(type) => onchange(type as ListType)} isDisabled={(type) => isDisabled(type as ListType)}>
    {#snippet icon(type)}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d={options.find((option) => option.type === type)?.path} />
        {#if type === ListType.timeline}<circle cx="6" cy="5" r="2" fill="currentColor" /><circle cx="6" cy="12" r="2" fill="currentColor" /><circle cx="6" cy="19" r="2" fill="currentColor" />{/if}
      </svg>
    {/snippet}
  </ChoiceGroup>
  <p class="type-description">{({ tasks: 'A simple checklist you can tick off.', notes: 'A space to collect your thoughts and ideas.', mixed: 'Tasks and notes, together in one list.', places: 'Save places and explore them on a map.', timeline: 'Keep your entries in chronological order.' })[value]}</p>
</fieldset>

<style>
  fieldset { min-width: 0; padding: 12px; }
  legend { float: left; width: 100%; margin-bottom: 8px; }
  .type-description { margin-top: 10px; color: rgb(var(--gray-500)); font-size: 13px; line-height: 1.5; }
</style>
