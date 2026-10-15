<script lang="ts">
  import Disclosure from './Disclosure.svelte';
  import Button from './Button.svelte';
  import { calendarDate, shiftDate, scheduleLabel, zonedInstant } from '../scheduling';
  import { enablePush } from '../push';
  import type { TaskSchedule, TaskReminder } from '../../../types/main';
  let { schedule = null, reminder = null, accountId, readonly = false, onsave, onremove }: {
    schedule?: TaskSchedule | null; reminder?: TaskReminder | null; accountId: string; readonly?: boolean;
    onremove?: () => void;
    onsave: (data: { schedule?: TaskSchedule | null; reminder?: TaskReminder | null }) => Promise<void>;
  } = $props();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let date = $state(''), time = $state(''), scheduleZone = $state(zone);
  let reminderDate = $state(''), reminderTime = $state(''), reminderZone = $state(zone);
  let error = $state(''), busy = $state(false), enabled = $state(false);
  const scheduleKey = $derived(JSON.stringify(schedule));
  const reminderKey = $derived(JSON.stringify(reminder));
  $effect(() => {
    const value = JSON.parse(scheduleKey) as TaskSchedule | null;
    date = value?.date ?? ''; time = value?.time ?? ''; scheduleZone = value?.timeZone ?? zone;
  });
  $effect(() => {
    const value = JSON.parse(reminderKey) as TaskReminder | null;
    const timeZone = value?.timeZone ?? zone;
    reminderZone = timeZone;
    reminderDate = value ? calendarDate(new Date(value.at), timeZone) : '';
    reminderTime = value ? new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value.at)) : '';
  });
  async function run(action: () => Promise<void>) {
    if (busy || readonly) return;
    busy = true; error = '';
    try { await action(); } catch (cause) { error = cause instanceof Error ? cause.message : 'Could not save scheduling.'; }
    finally { busy = false; }
  }
  async function saveDate() {
    await run(async () => {
      if (!date) throw new Error('Choose a date.');
      if (time) zonedInstant(date, time, scheduleZone);
      await onsave({ schedule: { date, ...(time ? { time } : {}), timeZone: scheduleZone } });
    });
  }
  async function saveReminder() {
    await run(async () => {
      if (!reminderDate || !reminderTime) throw new Error('Choose a reminder date and an explicit time.');
      const at = zonedInstant(reminderDate, reminderTime, reminderZone);
      if (Date.parse(at) <= Date.now()) throw new Error('Choose a future reminder time.');
      await enablePush(accountId);
      enabled = true;
      await onsave({ reminder: { id: crypto.randomUUID(), at, timeZone: reminderZone } });
    });
  }
</script>

<Disclosure title={schedule ? scheduleLabel(schedule, new Date(), zone) : 'Schedule & Reminder'} class="scheduling">
  <div class="space-y-4 text-sm">
    <fieldset disabled={readonly || busy} class="space-y-3">
      <legend class="mb-2 font-semibold">Scheduled date</legend>
      <div class="flex flex-wrap gap-2">{#each [['Today', 0], ['Tomorrow', 1], ['Next week', 7]] as [label, days]}<Button class="text-xs" onclick={() => { date = shiftDate(calendarDate(new Date(), zone), Number(days)); scheduleZone = zone; }}>{label}</Button>{/each}</div>
      <div class="flex flex-wrap gap-3">
        <label class="min-w-0 flex-1">Date<input aria-label="Scheduled date" type="date" min="2000-01-01" bind:value={date} /></label>
        <label class="min-w-0 flex-1">Time (optional)<input aria-label="Scheduled time" type="time" bind:value={time} /></label>
      </div>
      <p class="text-xs text-gray-500">{scheduleZone} · Date-only tasks stay on their selected date.</p>
      {#if !readonly}<div class="flex gap-2"><Button disabled={busy} onclick={saveDate}>Save date</Button>{#if schedule}<Button disabled={busy} onclick={() => run(() => onsave({ schedule: null }))}>Remove date</Button>{/if}</div>{/if}
    </fieldset>
    <fieldset disabled={readonly || busy} class="space-y-3">
      <legend class="mb-2 font-semibold">Push reminder</legend>
      <p class="text-xs text-gray-500">Independent of the scheduled date. Delivery starts after syncing online.</p>
      <div class="flex flex-wrap gap-3">
        <label class="min-w-0 flex-1">Reminder date<input aria-label="Reminder date" type="date" min="2000-01-01" bind:value={reminderDate} /></label>
        <label class="min-w-0 flex-1">Reminder time<input aria-label="Reminder time" type="time" bind:value={reminderTime} /></label>
      </div>
      <p class="text-xs text-gray-500">{reminderZone}</p>
      {#if !readonly}<div class="flex flex-wrap gap-2"><Button disabled={busy} onclick={saveReminder}>{busy ? 'Saving…' : reminder ? 'Update reminder' : 'Set reminder'}</Button>{#if reminder}<Button disabled={busy} onclick={() => run(() => onsave({ reminder: null }))}>Disable reminder</Button><Button disabled={busy} onclick={() => run(async () => { await enablePush(accountId); enabled = true; })}>Enable on this device</Button>{/if}</div>{/if}
      {#if enabled}<p role="status" class="text-xs text-gray-500">Notifications enabled on this device.</p>{/if}
    </fieldset>
    {#if onremove}<Button class="text-sm text-gray-500" onclick={onremove}>Remove Schedule &amp; Reminder</Button>{/if}
    {#if error}<p role="alert" class="text-danger">{error}</p>{/if}
  </div>
</Disclosure>

<style>
  input { display: block; width: 100%; min-width: 0; margin-top: 4px; padding: 8px; border: 1px solid rgb(var(--gray-300, 209 213 219)); border-radius: 8px; background: rgb(var(--surface)); }
</style>
