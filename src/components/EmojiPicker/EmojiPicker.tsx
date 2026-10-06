'use client';

import { useId, useState } from 'react';

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

export const EmojiPickerComponent = ({
  emoji,
  setEmoji,
}: {
  emoji: string;
  setEmoji: (emoji: string) => void;
}) => {
  const [query, setQuery] = useState('');
  const id = useId();
  const choices = emojis.filter(([, name]) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="drawer-section" aria-label="Choose list emoji">
      <label
        htmlFor={`${id}-search`}
        className="mb-2 block text-sm font-medium"
      >
        List emoji
      </label>
      <input
        id={`${id}-search`}
        aria-label="Search emojis"
        type="search"
        className="drawer-input"
        placeholder="Search emojis"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-9">
        {choices.map(([symbol, name]) => (
          <button
            key={symbol}
            type="button"
            aria-label={name}
            aria-pressed={emoji === symbol}
            title={name}
            onClick={() => setEmoji(symbol)}
            className={`rubber-button rubber-icon flex size-10 items-center justify-center rounded-lg border text-2xl hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${emoji === symbol ? 'border-primary bg-gray-200' : 'border-transparent'}`}
          >
            {symbol}
          </button>
        ))}
      </div>
      {!choices.length && (
        <p className="mt-3 text-sm text-gray-600">
          No matching emoji. Paste your own below.
        </p>
      )}
      <label
        htmlFor={`${id}-custom`}
        className="mb-1 mt-4 block text-sm text-gray-600"
      >
        Or paste an emoji
      </label>
      <input
        id={`${id}-custom`}
        aria-label="Custom emoji"
        maxLength={32}
        className="drawer-input text-2xl"
        value={emoji}
        onChange={(event) => setEmoji(event.target.value)}
      />
    </section>
  );
};
