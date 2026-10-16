<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { Colors } from '../../../types/colors';
  import { HexColors } from '../colors';
  import type { List } from '../../../types/main';
  let {
    color,
    emoji,
    onchange,
  }: {
    color: Colors;
    emoji: string;
    onchange: (data: Partial<Pick<List, 'color' | 'emoji'>>) => void;
  } = $props();
  let query = $state('');
  let expanded = $state(false);
  const favorites = ['🌍', '✅', '📝', '🎯', '🛒', '💡'];
  const emojis = [
    ['🌍', 'earth africa'],
    ['✅', 'Tasks'],
    ['📝', 'Notes'],
    ['📅', 'Calendar'],
    ['🎯', 'Goals'],
    ['⭐', 'Favorites'],
    ['💼', 'Work'],
    ['🏠', 'Home'],
    ['🛒', 'Shopping'],
    ['📚', 'Reading'],
    ['💡', 'Ideas'],
    ['🎨', 'Art'],
    ['🎵', 'Music'],
    ['🎮', 'Games'],
    ['✈️', 'Travel'],
    ['🚗', 'Car'],
    ['🚲', 'Cycling'],
    ['🏃', 'Running'],
    ['💪', 'Fitness'],
    ['🌱', 'Plants'],
    ['🐶', 'Dog'],
    ['🐱', 'Cat'],
    ['🍎', 'Food'],
    ['☕', 'Coffee'],
    ['😊', 'Happy'],
    ['❤️', 'Love'],
    ['🎁', 'Gifts'],
    ['🎉', 'Celebration'],
    ['💰', 'Money'],
    ['🔧', 'Repairs'],
    ['💻', 'Computer'],
    ['📷', 'Photos'],
    ['🧹', 'Cleaning'],
    ['🧘', 'Wellbeing'],
    ['🔥', 'Priority'],
    ['🚀', 'Launch'],
  ];
  const choices = $derived(
    emojis.filter(([, name]) =>
      name.toLowerCase().includes(query.toLowerCase()),
    ),
  );
</script>

<section class="list-color-row">
  <h3 class="list-field-label">Color</h3>
  <div class="list-colors" role="radiogroup" aria-label="List color">
    {#each Object.values(Colors) as value}<Button variant="touch"
      type="button" role="radio" aria-checked={color === value} aria-label={value}
      class="list-color" style={`background: ${HexColors.get(value)}`}
      onclick={() => onchange({ color: value })}
    ></Button>{/each}
  </div>
</section>
<section class="list-icon-section" aria-label="Choose list emoji">
  <h3 class="list-field-label">Icon</h3>
  <div class="list-favorite-icons">
    {#each (favorites.includes(emoji) || !emoji ? favorites : [...favorites.slice(0, -1), emoji]) as symbol}
      <Button variant="touch" type="button" aria-label={emojis.find(([icon]) => icon === symbol)?.[1] ?? symbol}
        aria-pressed={emoji === symbol} class="list-emoji"
        onclick={() => onchange({ emoji: symbol })}>{symbol}</Button>
    {/each}
    <Button variant="touch" type="button" class="list-emoji list-more-icons" aria-label="More emojis" aria-expanded={expanded} onclick={() => expanded = !expanded}>•••</Button>
  </div>
  {#if expanded}
    <div class="list-emoji-picker">
      <input aria-label="Search emojis" type="search" placeholder="Search emojis" bind:value={query} class="drawer-input" />
      <div class="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8">
        {#each choices as [symbol, name] (symbol)}<Button variant="touch" type="button" aria-label={name} aria-pressed={emoji === symbol} class="list-emoji" onclick={() => onchange({ emoji: symbol })}>{symbol}</Button>{/each}
      </div>
      {#if !choices.length}<p class="mt-3 text-sm text-gray-500">No matching emoji. Paste your own below.</p>{/if}
      <label class="mt-4 block text-sm text-gray-500">Or paste an emoji<input aria-label="Custom emoji" value={emoji} maxlength="32" class="drawer-input mt-1 text-2xl" oninput={(event) => onchange({ emoji: event.currentTarget.value })} /></label>
    </div>
  {/if}
</section>

<style>
.list-color-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px; border-block: 1px solid rgb(var(--gray-100)); }
.list-colors { display: flex; align-items: center; gap: 10px; }
:global(.list-color) { width: 20px; height: 20px; border: 1px solid rgb(0 0 0 / .06); border-radius: 50%; box-shadow: inset 0 1px 1px rgb(255 255 255 / .3), 0 1px 2px rgb(15 23 42 / .12); }
:global(.list-color[aria-checked='true']) { outline: 2px solid var(--editor-accent); outline-offset: 3px; }
.list-icon-section { padding: 12px; }
.list-favorite-icons { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
:global(.list-emoji) { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 28px; height: 30px; border: 1px solid rgb(var(--gray-100)); border-radius: 10px; background: rgb(var(--surface)); font-size: 18px; box-shadow: var(--ui-raised-shadow); }
:global(.list-emoji[aria-pressed='true']) { background: color-mix(in srgb, var(--editor-accent) 7%, rgb(var(--surface))); border-color: var(--editor-accent); box-shadow: var(--ui-raised-shadow), 2px 0 0 var(--editor-accent); }
:global(.list-more-icons) { color: rgb(var(--gray-500)); font-size: 12px; letter-spacing: 1px; }
.list-emoji-picker { margin-top: 20px; }
</style>
