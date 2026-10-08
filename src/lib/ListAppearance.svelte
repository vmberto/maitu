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

<section class="mt-4 rounded-lg bg-panel p-4">
  <h3 class="mb-3 text-sm font-medium">Select List Color</h3>
  <div class="flex gap-3" role="radiogroup" aria-label="List color">
    {#each Object.values(Colors) as value}<button
        type="button"
        role="radio"
        aria-checked={color === value}
        aria-label={value}
        class="rubber-touch size-8 rounded-full border-2"
        style:background={HexColors.get(value)}
        style:border-color={color === value
          ? 'rgb(var(--gray-900))'
          : 'transparent'}
        onclick={() => onchange({ color: value })}
      ></button>{/each}
  </div>
</section>
<section class="mt-4 rounded-lg bg-panel p-4" aria-label="Choose list emoji">
  <h3 class="mb-2 text-sm font-medium">List emoji</h3>
  <input
    aria-label="Search emojis"
    type="search"
    placeholder="Search emojis"
    bind:value={query}
    class="drawer-input"
  />
  <div class="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-9">
    {#each choices as [symbol, name] (symbol)}<button
        type="button"
        aria-label={name}
        aria-pressed={emoji === symbol}
        class="rubber-button rubber-icon flex size-10 items-center justify-center border text-2xl"
        style:border-color={emoji === symbol ? '#3664ff' : 'transparent'}
        onclick={() => onchange({ emoji: symbol })}>{symbol}</button
      >{/each}
  </div>
  {#if !choices.length}<p class="mt-3 text-sm text-gray-500">
      No matching emoji. Paste your own below.
    </p>{/if}<label class="mt-4 block text-sm text-gray-500"
    >Or paste an emoji<input
      aria-label="Custom emoji"
      value={emoji}
      maxlength="32"
      class="drawer-input mt-1 text-2xl"
      oninput={(event) => onchange({ emoji: event.currentTarget.value })}
    /></label
  >
</section>
