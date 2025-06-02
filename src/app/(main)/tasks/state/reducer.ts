import type { List, Task } from '@/types/main';

// Action Types
export const SET_INITIAL_STATE = 'SET_INITIAL_STATE';
export const SET_TASKS = 'SET_TASKS';
export const SET_SUBTASKS = 'SET_SUBTASKS';
export const SET_CURRENT_TASK = 'SET_CURRENT_TASK';
export const SET_NEW_TASK = 'SET_NEW_TASK';
export const UPDATE_SINGLE_TASK = 'UPDATE_SINGLE_TASK';
export const UPDATE_SINGLE_SUBTASK = 'UPDATE_SINGLE_SUBTASK';
export const SET_LOADING_ACTION = 'SET_LOADING_ACTION';

// State Type
export type TasksReducerState = {
  tasks: Task[];
  subtasks: Task[];
  fetchingSubtasks: boolean;
  selectedList: List;
  currentTask: Task;
  newTask: Task;
  loadingAction: boolean;
};

// Initial State
export const initialState: TasksReducerState = {
  tasks: [],
  subtasks: [],
  fetchingSubtasks: false,
  selectedList: {} as List,
  currentTask: {} as Task,
  newTask: {} as Task,
  loadingAction: false,
};

// Action Types
type TasksAction =
  | {
      type: typeof SET_INITIAL_STATE;
      payload: { tasks: Task[]; selectedList: List };
    }
  | {
      type: typeof SET_SUBTASKS;
      payload: { subtasks: Task[]; fetchingSubtasks: boolean };
    }
  | { type: typeof SET_TASKS; payload: Task[] }
  | { type: typeof SET_CURRENT_TASK; payload: Task }
  | { type: typeof SET_NEW_TASK; payload: Task }
  | {
      type: typeof UPDATE_SINGLE_TASK | typeof UPDATE_SINGLE_SUBTASK;
      payload: { taskId: string; fieldsToUpdate: Partial<Task> };
    }
  | { type: typeof SET_LOADING_ACTION; payload: boolean };

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

    case SET_SUBTASKS:
      return { ...state, ...action.payload };

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

    case UPDATE_SINGLE_SUBTASK:
      return {
        ...state,
        subtasks: state.subtasks.map((task) =>
          task._id === action.payload.taskId
            ? { ...task, ...action.payload.fieldsToUpdate }
            : task,
        ),
      };

    case SET_LOADING_ACTION:
      return { ...state, loadingAction: action.payload };

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

export const setSubTasks = (
  subtasks: Task[],
  fetchingSubtasks: boolean,
): TasksAction => ({
  type: SET_SUBTASKS,
  payload: { subtasks, fetchingSubtasks },
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
  isSubtask: boolean,
): TasksAction => ({
  type: isSubtask ? UPDATE_SINGLE_SUBTASK : UPDATE_SINGLE_TASK,
  payload: {
    taskId,
    fieldsToUpdate,
  },
});

export const setLoadingAction = (loadingAction: boolean): TasksAction => ({
  type: SET_LOADING_ACTION,
  payload: loadingAction,
});

export default tasksReducer;
