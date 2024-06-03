import { useEffect } from 'react';

import { NewTaskInput } from '@/src/app/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/tasks/components/Tasks/TaskInput';
import { useTasks } from '@/src/app/tasks/state/provider';
import { Typography } from '@/src/components/Typography';

export const SubTasksWrapper = () => {
  const { handleGetSubtasks, subtasks } = useTasks();

  useEffect(() => {
    handleGetSubtasks();
  }, []);

  return (
    <section className="relative h-fit rounded-2xl bg-gray-100 p-4">
      <Typography as="h1">Subtasks</Typography>

      {/* {!hasSubtasks && ( */}
      {/*  <Typography as="p" className="ml-auto flex self-center"> */}
      {/*    <ChevronRightIcon className="relative mr-3 size-5 cursor-pointer self-center" /> */}
      {/*  </Typography> */}
      {/* )} */}

      {subtasks.map((task) => (
        <TaskInput key={task.createdAt} taskData={task} />
      ))}

      <NewTaskInput />
    </section>
  );
};
