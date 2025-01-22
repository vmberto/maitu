import type { List, Task } from '@/types/main';

export const SET_INITIAL_STATE = 'SET_INITIAL_STATE';
export const SET_TASKS = 'SET_TASKS';
export const SET_CURRENT_TASK = 'SET_CURRENT_TASK';
export const SET_NEW_TASK = 'SET_NEW_TASK';
export const UPDATE_SINGLE_TASK = 'UPDATE_SINGLE_TASK';

export type TasksReducerState = {
  tasks: Task[];
  selectedList: List;
  currentTask: Task;
  newTask: Task;
};

export const initialState = {
  tasks: [],
  selectedList: {} as List,
  currentTask: {} as Task,
  newTask: {} as Task,
};

type TasksAction =
  | {
      type: typeof SET_INITIAL_STATE;
      payload: { tasks: Task[]; selectedList: List };
    }
  | { type: typeof SET_TASKS; payload: Task[] }
  | { type: typeof SET_CURRENT_TASK; payload: Task }
  | { type: typeof SET_NEW_TASK; payload: Task }
  | {
      type: typeof UPDATE_SINGLE_TASK;
      payload: { taskId: string; fieldsToUpdate: Partial<Task> };
    };

const tasksReducer = (
  state: TasksReducerState,
  action: TasksAction,
): TasksReducerState => {
  switch (action.type) {
    case SET_INITIAL_STATE:
      return {
        ...state,
        ...action.payload,
      };

    case SET_TASKS:
      return { ...state, tasks: action.payload };

    case SET_CURRENT_TASK:
      return { ...state, currentTask: action.payload };

    case SET_NEW_TASK:
      return { ...state, newTask: action.payload };

    case UPDATE_SINGLE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload.taskId
            ? { ...task, ...action.payload.fieldsToUpdate }
            : task,
        ),
      };

    default:
      return state;
  }
};

export const setInitialState = (
  tasks: Task[],
  selectedList: List,
): TasksAction => ({
  type: SET_INITIAL_STATE,
  payload: { tasks, selectedList },
});

export const setTasks = (tasks: Task[]): TasksAction => ({
  type: SET_TASKS,
  payload: tasks,
});

export const setCurrentTask = (currentTask: Task): TasksAction => ({
  type: SET_CURRENT_TASK,
  payload: currentTask,
});

export const setNewTask = (newTask: Task): TasksAction => ({
  type: SET_NEW_TASK,
  payload: newTask,
});

export const updateSingleTask = (
  taskId: string,
  fieldsToUpdate: Partial<Task>,
): TasksAction => ({
  type: UPDATE_SINGLE_TASK,
  payload: {
    taskId,
    fieldsToUpdate,
  },
});

export default tasksReducer;
