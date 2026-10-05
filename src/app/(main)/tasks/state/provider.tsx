'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalTasks } from '@/src/components/Offline/useLocalTasks';

export type TasksState = ReturnType<typeof useLocalTasks>;
const TasksContext = createContext<TasksState>({} as TasksState);
export function TasksProvider({
  children,
  listId,
}: {
  children: ReactNode;
  listId: string;
}) {
  const value = useLocalTasks(listId);
  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
export const useTasks = () => useContext(TasksContext);
