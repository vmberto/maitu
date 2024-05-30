import type { List, Task } from '@/types/main';

export const SET_INITIAL_STATE = 'SET_INITIAL_STATE';
export const SET_TODOS = 'SET_TODOS';
export const SET_CURRENT_TODO = 'SET_CURRENT_TODO';
export const SET_NEW_TODO = 'SET_NEW_TODO';
export const UPDATE_SINGLE_ELEMENT = 'UPDATE_SINGLE_ELEMENT';

export type TasksReducerState = {
  tasks: Task[];
  subtasks: Task[];
  selectedList: List;
  currentTask: Task;
  newTask: Task;
};

export const initialState = {
  tasks: [],
  subtasks: [],
  selectedList: {} as List,
  currentTask: {} as Task,
  newTask: {} as Task,
};

type TasksAction =
  | {
      type: typeof SET_INITIAL_STATE;
      payload: { tasks: Task[]; selectedList: List };
    }
  | { type: typeof SET_TODOS; payload: Task[] }
  | { type: typeof SET_CURRENT_TODO; payload: Task }
  | { type: typeof SET_NEW_TODO; payload: Task }
  | {
      type: typeof UPDATE_SINGLE_ELEMENT;
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

    case SET_TODOS:
      return { ...state, tasks: action.payload };

    case SET_CURRENT_TODO:
      return { ...state, currentTask: action.payload };

    case SET_NEW_TODO:
      return { ...state, newTask: action.payload };

    case UPDATE_SINGLE_ELEMENT:
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
  type: SET_TODOS,
  payload: tasks,
});

export const setCurrentTask = (currentTask: Task): TasksAction => ({
  type: SET_CURRENT_TODO,
  payload: currentTask,
});

export const setNewTask = (newTask: Task): TasksAction => ({
  type: SET_NEW_TODO,
  payload: newTask,
});

export const updateSingleElement = (
  taskId: string,
  fieldsToUpdate: Partial<Task>,
): TasksAction => ({
  type: UPDATE_SINGLE_ELEMENT,
  payload: {
    taskId,
    fieldsToUpdate,
  },
});

export default tasksReducer;
