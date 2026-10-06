'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { UserInfoSlideOverWrapper } from '@/src/app/(main)/components/UserInfoSlideOver/server';
import { AppLink } from '@/src/components/Offline/AppLink';
import { FontColor, HexColors } from '@/src/lib/colors';
import type { ReactNode } from 'react';
import type { List } from '@/types/main';

export function AppHeader({
  list,
  actions,
}: {
  list?: List;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-gray-100">
      <div className="mx-auto flex h-12 max-w-xl items-center gap-3 px-5">
        {list && (
          <AppLink
            href="/"
            aria-label="Back to lists"
            style={{ color: HexColors.get(list.color) ?? '#3664ff' }}
            className="rubber-button rubber-icon flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="size-5" />
          </AppLink>
        )}
        <h1
          className={`min-w-0 truncate text-xl font-semibold ${FontColor.get(list?.color ?? 'primary')}`}
        >
          {list?.title ?? 'maitu'}
        </h1>
        {(actions || list?.emoji) && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {actions}
            {list?.emoji && (
              <span aria-hidden="true" className="text-2xl">
                {list.emoji}
              </span>
            )}
          </div>
        )}
        {!list && <UserInfoSlideOverWrapper />}
      </div>
    </header>
  );
}
