'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useContext } from 'react';

import { TodosContext } from '@/src/app/todos/hooks/useTodos';
import { FontColor, HexColors } from '@/src/lib/colors';
import { stopPropagationFn } from '@/src/lib/functions';

export const Header = () => {
  const { selectedTodoList } = useContext(TodosContext);

  return (
    <div className="flex items-center py-2">
      <Link
        className="flex h-12 pl-5"
        onClick={stopPropagationFn}
        href="/lists"
      >
        <ArrowLeftIcon
          className="relative mr-3 w-6 cursor-pointer"
          color={HexColors.get(selectedTodoList.color)}
        />
      </Link>
      <h1
        className={`pr-5 text-2xl font-bold ${FontColor.get(
          selectedTodoList.color,
        )}`}
      >
        {selectedTodoList?.title}
      </h1>
    </div>
  );
};
