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
      {currentTodo?.completeDisabled ? (
        <CheckCircleIcon className="mb-1 mr-1 inline size-6" color="#5aee5c" />
      ) : (
        <PlayCircleIcon
          className="mb-1 mr-1 inline size-6"
          color={HexColors.get('primary')}
        />
      )}
      <div className="inline">{currentTodo?.title}</div>
      {currentTodo?.createdAt && (
        <div className="mt-2 flex flex-col gap-2.5 text-sm text-gray-500">
          {formatDate(currentTodo?.createdAt)}
        </div>
      )}
    </>
  );
};
