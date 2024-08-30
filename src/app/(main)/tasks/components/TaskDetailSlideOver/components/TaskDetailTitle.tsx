import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';

import { HexColors } from '@/src/lib/colors';
import { formatDate } from '@/src/lib/functions';
import type { Task } from '@/types/main';

type TaskDetailTitleProps = {
  taskData?: Task;
  listColor: string;
};

export const TaskDetailTitle = ({
  taskData,
  listColor,
}: TaskDetailTitleProps) => (
  <>
    <PlayCircleIcon
      className="mb-1 mr-1 inline size-6"
      color={HexColors.get(listColor)}
    />

    <div className="inline">{taskData?.title}</div>
    <div className="mt-2 flex flex-row items-center gap-2 text-sm text-gray-500">
      {formatDate(taskData?.createdAt)}
      {taskData?.completedAt && (
        <>
          <CheckCircleIcon className="inline size-5" color="#5aee5c" />
          {formatDate(taskData?.completedAt)}
        </>
      )}
    </div>
  </>
);
