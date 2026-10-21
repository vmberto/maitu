<script lang="ts">
  import Section from './Section.svelte';
  import AddonMenu from './AddonMenu.svelte';
  import Button from './Button.svelte';
  import { calendarDate } from '../scheduling';
  import { nextOccurrence, validRecurrence } from '../recurrence';
  import type { TaskRecurrence } from '../../../types/main';
  let { recurrence = null, readonly = false, onsave, onremove }: {
    recurrence?: TaskRecurrence | null; readonly?: boolean;
    onsave: (recurrence: TaskRecurrence) => Promise<void>; onremove?: () => void;
  } = $props();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let dayOfMonth = $state<number | undefined>(1), nextDate = $state(''), timeZone = $state(zone);
  let busy = $state(false), error = $state('');
  const key = $derived(JSON.stringify(recurrence));
  $effect(() => {
    const value = JSON.parse(key) as TaskRecurrence | null;
    dayOfMonth = value?.dayOfMonth ?? 1;
    nextDate = value?.nextDate ?? nextOccurrence(calendarDate(new Date(), zone), value?.dayOfMonth ?? 1);
    timeZone = value?.timeZone ?? zone;
  });
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (readonly || busy) return;
    const value = { dayOfMonth, nextDate: nextOccurrence(calendarDate(new Date(), timeZone), dayOfMonth ?? 1), timeZone };
    if (!validRecurrence(value)) { error = 'Choose a valid date and a day from 1 to 31.'; return; }
    busy = true; error = '';
    try { await onsave(value); }
    catch { error = 'Could not save recurrence. Please try again.'; }
    finally { busy = false; }
  }
</script>

<Section title="Recurrent Tasks">
  {#snippet actions()}{#if onremove}<AddonMenu name="Recurrent Tasks" onremove={onremove} />{/if}{/snippet}
  <form onsubmit={save} class="space-y-3 text-sm">
    <p class="text-gray-500">Create a new task each month at 00:00 ({timeZone}). Unfinished tasks stay in the list; new copies get a numbered name.</p>
    <fieldset disabled={readonly || busy} class="space-y-3">
      <label class="block">Day of the month<input aria-label="Day of the month" type="number" min="1" max="31" step="1" required bind:value={dayOfMonth} class="drawer-input mt-1" /></label>
      <p class="text-gray-500">When the selected day is missing, use the last day of the month.</p>
      <Button type="submit">Save recurrence</Button>
    </fieldset>
    {#if recurrence}<p class="text-gray-500">Next occurrence: {nextDate}. Active. This task controls future copies, even when completed. Remove this add-on to stop repeating.</p>{/if}
    {#if error}<p role="alert" class="text-danger">{error}</p>{/if}
  </form>
</Section>
