'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';

import { add, remove, update } from '@/src/actions/tasks.action';
import type { TasksReducerState } from '@/src/app/(main)/tasks/state/reducer';
import tasksReducer, {
  initialState,
  setCurrentTask,
  setInitialState,
  setNewTask,
  setTasks,
  updateSingleTask,
} from '@/src/app/(main)/tasks/state/reducer';
import { useExecutionTimeout } from '@/src/hooks/useExecutionTimeout';
import { json } from '@/src/lib/functions';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { List, Task } from '@/types/main';

export type TasksState = TasksReducerState & {
  handleSetInitialState: (list: List, Task: Task[]) => void;

  handleChangeExistingTask: (e: TextareaChangeEventHandler) => void;
  handleCompleteTask: (t: Task) => Promise<void>;
  handleChangeNewTask: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Task) => () => Promise<void>;

  handleAddTask: () => Promise<void>;
  handleRemoveOrUpdateTitle: () => Promise<void>;
  handleUpdateTask: (t: Task) => () => Promise<void>;
};

type TasksProviderProps = {
  children: ReactNode;
};

const TasksContext = createContext<TasksState>({} as TasksState);

export const TasksProvider = ({ children }: TasksProviderProps) => {
  const { setExecutionTimeout, clearTimeoutById } = useExecutionTimeout();

  const [state, dispatch] = useReducer(tasksReducer, initialState);

  const handleSetInitialState = async (list: List, tasks: Task[]) => {
    dispatch(setInitialState(json(tasks), json(list)));
  };

  const handleChangeExistingTask = (e: TextareaChangeEventHandler) => {
    const currentTaskCopy = { ...state.currentTask };
    const { value } = e.target;

    currentTaskCopy.title = value;

    dispatch(
      updateSingleTask(
        currentTaskCopy._id?.toString() || '',
        { ...currentTaskCopy },
        false,
      ),
    );
    dispatch(setCurrentTask({ ...currentTaskCopy }));
  };

  const handleChangeNewTask = (e: TextareaChangeEventHandler) => {
    const newTaskCopy: Task = { ...state.newTask };
    const { value } = e.target;
    newTaskCopy.title = value!;
    dispatch(setNewTask(newTaskCopy));
  };

  const handleInputFocus = (focusedTask: Task) => async () => {
    dispatch(setCurrentTask({ ...focusedTask }));
  };

  const handleRemoveOrUpdateTitle = async () => {
    const { currentTask } = state;

    if (!currentTask.title && currentTask._id) {
      dispatch(
        setTasks(state.tasks.filter((task) => task._id !== currentTask._id)),
      );

      await remove(currentTask._id.toString());

      return;
    }

    if (currentTask._id) {
      await update(currentTask._id.toString().trim(), currentTask);
    }
  };

  const handleUpdateTask = (t: Task) => async () => {
    if (t._id) {
      dispatch(updateSingleTask(t._id.toString(), { ...t }, false));

      await update(t._id.toString(), t);
    }
  };

  const handleAddTask = async () => {
    const {
      newTask: { title },
      selectedList: { _id: listId },
    } = state;

    if (title && title.length > 0) {
      const task = {
        complete: false,
        description: '',
        createdAt: new Date().toISOString(),
        listId,
        title,
        parentTaskId: null,
      } as Task;

      dispatch(setNewTask({ title: '' } as Task));

      const tasksCopy = [...state.tasks];
      dispatch(setTasks([...tasksCopy, task]));
      const response = await add(task);
      dispatch(setTasks([...tasksCopy, response]));
    }
  };

  const handleCompleteTask = async (t: Task) => {
    if (!t._id) {
      return;
    }

    const taskId = t._id.toString();

    if (!t.complete) {
      const dataToUpdate = {
        complete: true,
        completedAt: new Date().toISOString(),
      };

      setExecutionTimeout(taskId, async () => {
        if (t._id) {
          dispatch(updateSingleTask(t._id.toString(), dataToUpdate, false));
          await update(t._id.toString(), {
            ...t,
            ...dataToUpdate,
          });
        }
      });
    } else {
      clearTimeoutById(taskId);
    }

    dispatch(
      updateSingleTask(
        t._id.toString(),
        {
          complete: !t.complete,
          completedAt: undefined,
        },
        false,
      ),
    );
  };

  const contextValue = {
    ...state,
    handleSetInitialState,

    handleAddTask,
    handleChangeExistingTask,
    handleChangeNewTask,
    handleCompleteTask,
    handleRemoveOrUpdateTitle,
    handleUpdateTask,
    handleInputFocus,
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = (): TasksState => useContext(TasksContext);
