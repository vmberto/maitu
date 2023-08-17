import { createContext, FC, useReducer } from 'react';
import reducer from 'src/state/todos/useTodoReducer';
import { Todo, TodoList } from 'src/types/main';
import { GenericEvent, TextareaChangeEventHandler } from 'src/types/events';
import { useRouter } from 'next/router';
import { TodosDispatchActions as Actions } from 'src/state/todos/actions';
import * as TodosDb from 'src/lib/database/todosDb';
import { useLiveQuery } from 'dexie-react-hooks';

export interface TodosState {
  selectedTodoList: TodoList;
  listId: string;
  todos: Todo[];

  newTodo: Todo;
}

interface TodosActions {
  handleChange: (t: Todo) => (e: GenericEvent) => void;
  handleChangeNewTodo: (e: GenericEvent) => void;
  handleAddTodo: () => void;
  handleRemoveTodo: (id: string) => void;
  handleUpdateTodo: (t: Todo) => void;
  handleCompleteTodo: (t: Todo) => void;
}

const initialState = {
  listId: '',
  selectedTodoList: {} as TodoList,
  todos: [],
  newTodo: {} as Todo
} as TodosState;

export const TodosContext = createContext({} as TodosState & TodosActions);
let timeouts = [] as { id: string; timeout: NodeJS.Timeout }[];

const TodosProvider: FC = ({ children }) => {
  const { listId } = useRouter().query;
  const [state, dispatch] = useReducer(reducer, initialState);

  useLiveQuery(() => {
    (async () => {
      if (listId) {
        const { selectedTodoList, todos } = await TodosDb.get(listId);
        dispatch({
          type: Actions.SET_TODOS,
          selectedTodoList,
          todos
        });
      }
    })();
  }, [listId]);

  const value: TodosState & TodosActions = {
    ...state,
    handleChange: (t: Todo) => (e: TextareaChangeEventHandler) =>
      dispatch({ type: Actions.ON_CHANGE_TODO, id: t.id, value: e.target.value }),
    handleChangeNewTodo: (e: TextareaChangeEventHandler) =>
      dispatch({ type: Actions.ON_CHANGE_NEW_TODO, value: e.target.value }),
    handleAddTodo: async () => {
      const addedTodo = {
        listId,
        title: state.newTodo.title,
        complete: false,
        completeDisabled: false
      } as Todo;
      dispatch({ type: Actions.ADD_TODO, addedTodo });
      await TodosDb.add(addedTodo);
    },
    handleRemoveTodo: async (id) => {
      dispatch({ type: Actions.REMOVE_TODO, id });
      await TodosDb.remove(id);
    },
    handleUpdateTodo: async (t) => {
      await TodosDb.update(t.id, t);
    },
    handleCompleteTodo: async (t) => {
      if (!t.complete) {
        timeouts.push({
          id: t.id,
          timeout: setTimeout(async () => {
            dispatch({ type: Actions.COMPLETE_DISABLED_TODO, id: t.id });
            await TodosDb.update(t.id, { ...t, completeDisabled: true });
          }, 2000)
        });
      } else {
        const timeoutObj = timeouts.find((timeout) => timeout.id === t.id);
        if (timeoutObj) {
          clearTimeout(timeoutObj.timeout);
          timeouts = timeouts.filter((t) => t.id !== timeoutObj.id);
        }
      }
      await TodosDb.update(t.id, { ...t, complete: !t.complete });
      dispatch({
        type: Actions.COMPLETE_TODO,
        id: t.id,
        complete: t.complete
      });
    }
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
};

export default TodosProvider;
