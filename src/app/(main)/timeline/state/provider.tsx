'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalTasks } from '@/src/components/Offline/useLocalTasks';

export type TimelineState = ReturnType<typeof useLocalTasks>;
const TimelineContext = createContext<TimelineState>({} as TimelineState);
export function TimelineProvider({
  children,
  listId,
}: {
  children: ReactNode;
  listId: string;
}) {
  const value = useLocalTasks(listId);
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}
export const useTimeline = () => useContext(TimelineContext);
