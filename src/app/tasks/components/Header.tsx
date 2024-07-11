'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { useTasks } from '@/src/app/tasks/state/provider';
import { Typography } from '@/src/components/Typography';
import { FontColor, HexColors } from '@/src/lib/colors';
import { stopPropagationFn } from '@/src/lib/functions';
import { clickStyle } from '@/src/lib/style-consts';

export const Header = () => {
  const { selectedList } = useTasks();

  return (
    <header
      className={`${clickStyle} sticky top-0 z-20 border-b-2 border-gray-100 bg-white align-middle`}
    >
      <div className="mx-auto flex h-full max-w-xl items-center">
        <Link className="flex h-12 pl-5" onClick={stopPropagationFn} href="/">
          <ArrowLeftIcon
            className="relative mr-3 size-5 cursor-pointer self-center"
            color={HexColors.get(selectedList.color)}
          />
        </Link>
        <Typography
          as="h1"
          className={`cursor-default pr-5 text-xl font-bold ${FontColor.get(
            selectedList.color,
          )}`}
        >
          {selectedList?.title}
        </Typography>
      </div>
    </header>
  );
};
