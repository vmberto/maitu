<script lang="ts">
  import { Colors } from '../../types/colors';
  import { HexColors } from './colors';
  import type { List } from '../../types/main';
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
    {#each Object.values(Colors) as value}<button
      type="button" role="radio" aria-checked={color === value} aria-label={value}
      class="rubber-touch list-color" style:background={HexColors.get(value)}
      onclick={() => onchange({ color: value })}
    ></button>{/each}
  </div>
</section>
<section class="list-icon-section" aria-label="Choose list emoji">
  <h3 class="list-field-label">Icon</h3>
  <div class="list-favorite-icons">
    {#each (favorites.includes(emoji) || !emoji ? favorites : [...favorites.slice(0, -1), emoji]) as symbol}
      <button type="button" aria-label={emojis.find(([icon]) => icon === symbol)?.[1] ?? symbol}
        aria-pressed={emoji === symbol} class="rubber-touch list-emoji"
        onclick={() => onchange({ emoji: symbol })}>{symbol}</button>
    {/each}
    <button type="button" class="rubber-touch list-emoji list-more-icons" aria-label="More emojis" aria-expanded={expanded} onclick={() => expanded = !expanded}>•••</button>
  </div>
  {#if expanded}
    <div class="list-emoji-picker">
      <input aria-label="Search emojis" type="search" placeholder="Search emojis" bind:value={query} class="drawer-input" />
      <div class="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8">
        {#each choices as [symbol, name] (symbol)}<button type="button" aria-label={name} aria-pressed={emoji === symbol} class="rubber-touch list-emoji" onclick={() => onchange({ emoji: symbol })}>{symbol}</button>{/each}
      </div>
      {#if !choices.length}<p class="mt-3 text-sm text-gray-500">No matching emoji. Paste your own below.</p>{/if}
      <label class="mt-4 block text-sm text-gray-500">Or paste an emoji<input aria-label="Custom emoji" value={emoji} maxlength="32" class="drawer-input mt-1 text-2xl" oninput={(event) => onchange({ emoji: event.currentTarget.value })} /></label>
    </div>
  {/if}
</section>
