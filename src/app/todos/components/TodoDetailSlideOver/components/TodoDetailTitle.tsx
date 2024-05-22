import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';

import { HexColors } from '@/src/lib/colors';
import { formatDate } from '@/src/lib/functions';
import type { Todo } from '@/types/main';

type TodoDetailTitleProps = {
  currentTodo?: Todo;
};

export const TodoDetailTitle = ({ currentTodo }: TodoDetailTitleProps) => {
  return (
    <>
      <PlayCircleIcon
        className="mb-1 mr-1 inline size-6"
        color={HexColors.get('primary')}
      />

      <div className="inline">{currentTodo?.title}</div>
      <div className="mt-2 flex flex-row items-center gap-2 text-sm text-gray-500">
        {formatDate(currentTodo?.createdAt)}
        {currentTodo?.completedAt && (
          <>
            <CheckCircleIcon className="inline size-5" color="#5aee5c" />
            {formatDate(currentTodo?.completedAt)}
          </>
        )}
      </div>
    </>
  );
};
