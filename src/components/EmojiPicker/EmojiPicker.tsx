import type { Categories, EmojiStyle } from 'emoji-picker-react';
import dynamic from 'next/dynamic';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import React from 'react';

import { Typography } from '@/src/components/Typography/Typography';

type EmojiPickerProps = {
  emoji: string;
  setEmoji: (emoji: string) => void;
};

export const EmojiPickerComponent = ({ emoji, setEmoji }: EmojiPickerProps) => {
  return (
    <div>
      <span className="mb-2 block font-light text-gray-700">List Emoji</span>
      {emoji && (
        <button
          onClick={() => setEmoji('')}
          type="button"
          className="flex items-center rounded-md border-2 border-gray-200 p-3 hover:bg-gray-100"
        >
          <Typography as="h1" className="text-6xl">
            {emoji}
          </Typography>
        </button>
      )}

      {!emoji && (
        <EmojiPicker
          open={!emoji}
          emojiStyle={'native' as EmojiStyle}
          previewConfig={{ showPreview: false }}
          width="100%"
          height="70vh"
          lazyLoadEmojis
          onEmojiClick={({ emoji: e }) => setEmoji(e)}
          data-testid="emoji-picker"
          categories={[
            {
              category: 'travel_places' as Categories,
              name: 'Travel & Places',
            },
            {
              category: 'activities' as Categories,
              name: 'Activities',
            },
            {
              category: 'smileys_people' as Categories,
              name: 'Smileys & People',
            },
            {
              category: 'animals_nature' as Categories,
              name: 'Animals & Nature',
            },
            {
              category: 'food_drink' as Categories,
              name: 'Food & Drink',
            },
            {
              category: 'objects' as Categories,
              name: 'Objects',
            },
            {
              category: 'symbols' as Categories,
              name: 'Symbols',
            },
            {
              category: 'flags' as Categories,
              name: 'Flags',
            },
          ]}
        />
      )}
    </div>
  );
};
