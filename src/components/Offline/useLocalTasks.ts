'use client';

import { useEffect, useRef, useState } from 'react';
import { useOffline } from './OfflineProvider';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { List, Task } from '@/types/main';

// Tasks and timeline share persistence; only their presentation differs.
export function useLocalTasks(listId: string) {
  const { account, add, update, remove } = useOffline();
  const { modalData, isOpen } = useSlideOver<Task>();
  const [currentTask, setCurrentTask] = useState<Task>({} as Task);
  const [newTask, setNewTask] = useState<Task>({ title: '' } as Task);
  const [loadingAction, setLoadingAction] = useState(false);
  const creating = useRef(false);
  const completionScopeAlive = useRef(true);
  const completionTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const [pendingCompletionIds, setPendingCompletionIds] = useState(
    new Set<string>(),
  );
  useEffect(() => {
    completionScopeAlive.current = true;
    const timers = completionTimers.current;
    return () => {
      completionScopeAlive.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);
  function clearCompletionGrace(id: string) {
    clearTimeout(completionTimers.current.get(id));
    completionTimers.current.delete(id);
    setPendingCompletionIds((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }
  const selectedList =
    (account?.lists.find(
      (list) => list._id === listId && !list.deleted,
    ) as List) ?? ({} as List);
  const allTasks = (
    account?.tasks.filter(
      (task) => !task.deleted && String((task as Task).listId) === listId,
    ) ?? []
  ).map((task) =>
    task._id === currentTask._id ? { ...task, title: currentTask.title } : task,
  ) as Task[];
  const tasks = allTasks.filter((task) => !task.parentTaskId);
  const subtasks = allTasks.filter(
    (task) => String(task.parentTaskId) === String(modalData?._id),
  );

  const handleUpdateTask = (task: Partial<Task>) => async () => {
    if (task._id) await update('tasks', task._id.toString(), task);
  };
  const handleChangeExistingTask = (event: TextareaChangeEventHandler) => {
    const changed = { ...currentTask, title: event.target.value };
    setCurrentTask(changed);
    // Persist each edit, rather than keeping the only copy in an onBlur draft.
    if (changed._id)
      void update('tasks', changed._id.toString(), {
        title: changed.title,
      }).catch(() => {});
  };
  return {
    tasks,
    subtasks,
    selectedList,
    currentTask,
    newTask,
    loadingAction,
    fetchingSubtasks: false,
    pendingCompletionIds,
    handleInputFocus: (task: Task) => async () => {
      setCurrentTask(task);
    },
    handleChangeExistingTask,
    handleChangeNewTask: (event: TextareaChangeEventHandler) =>
      setNewTask({ ...newTask, title: event.target.value }),
    handleUpdateTask,
    handleRemoveOrUpdateTitle: async () => {
      if (currentTask._id && !currentTask.title)
        await remove('tasks', currentTask._id.toString());
      setCurrentTask({} as Task);
    },
    handleAddTask: async () => {
      if (!newTask.title?.trim() || creating.current) return;
      creating.current = true;
      try {
        await add('tasks', {
          title: newTask.title,
          description: '',
          complete: false,
          createdAt: new Date().toISOString(),
          listId,
          parentTaskId: isOpen ? (modalData?._id ?? null) : null,
        });
        setNewTask({ title: '' } as Task);
      } finally {
        creating.current = false;
      }
    },
    handleCompleteTask: async (task: Task) => {
      if (!task._id) return;
      const id = task._id.toString();
      if (task.complete) {
        await update('tasks', id, { complete: false, completedAt: null });
        clearCompletionGrace(id);
        return;
      }
      // Save completion immediately; delay only the visual move so reloads never lose it.
      setPendingCompletionIds((previous) => new Set(previous).add(id));
      try {
        await update('tasks', id, {
          complete: true,
          completedAt: new Date().toISOString(),
        });
        if (!completionScopeAlive.current) return;
        clearTimeout(completionTimers.current.get(id));
        completionTimers.current.set(
          id,
          setTimeout(() => clearCompletionGrace(id), 3000),
        );
      } catch (error) {
        clearCompletionGrace(id);
        throw error;
      }
    },
    handleCloneTask: async () => {
      if (!modalData) return;
      setLoadingAction(true);
      try {
        const source =
          allTasks.find((task) => String(task._id) === String(modalData._id)) ??
          modalData;
        const cloned = await add('tasks', {
          ...source,
          title: `${source.title} (Clone)`,
          complete: false,
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          parentTaskId: null,
        });
        for (const subtask of subtasks)
          await add('tasks', {
            ...subtask,
            parentTaskId: cloned._id,
            complete: false,
            completedAt: undefined,
            createdAt: new Date().toISOString(),
          });
      } finally {
        setLoadingAction(false);
      }
    },
  };
}
