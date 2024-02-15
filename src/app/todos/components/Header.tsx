'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect } from 'react';

import { useTodos } from '@/src/app/todos/provider';
import { FontColor, HexColors } from '@/src/lib/colors';
import { stopPropagationFn } from '@/src/lib/functions';
import type { List } from '@/types/main';

export const Header = (list: List) => {
  const { handleSetList } = useTodos();

  useEffect(() => {
    handleSetList(list);
  }, [handleSetList, list]);

  return (
    <div className="flex items-center py-2">
      <Link
        className="flex h-12 pl-5"
        onClick={stopPropagationFn}
        href="/lists"
      >
        <ArrowLeftIcon
          className="relative mr-3 w-6 cursor-pointer"
          color={HexColors.get(list.color)}
        />
      </Link>
      <h1 className={`pr-5 text-2xl font-bold ${FontColor.get(list.color)}`}>
        {list.title}
      </h1>
    </div>
  );
};
