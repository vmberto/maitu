import { createContext, FC, useEffect, useReducer } from 'react';
import reducer from '@/state/todos/useTodoReducer';
import axios from 'axios';
import { Todo } from '@/types/main';
import { GenericEvent } from '@/types/events';
import mongoObjectId from '@/lib/generateUniqueId';
import { db } from '@/lib/local-data';
import { useRouter } from 'next/router';

export interface TodosState {
  listTitle: string;
  listId: string;
  todos: Todo[];

  newTodo: Todo;
}

interface TodosActions {
  handleChange: (index: number) => (e: GenericEvent) => void;
  handleChangeNewTodo: (e: GenericEvent) => void;
  handleAddTodo: () => void;
  handleRemoveTodo: (_id: string, index: number) => void;
  handleUpdateTodo: (t: Todo) => void;
}

const initialState = (listId: any) =>
  ({ listId, listTitle: '', todos: [], newTodo: {} as Todo } as TodosState);

export const TodosContext = createContext({} as TodosState & TodosActions);

interface TodosProviderProps {}
const TodosProvider: FC<TodosProviderProps> = ({ children }) => {
  const router = useRouter();
  const {
    query: { listId, listTitle }
  } = router;
  const [state, dispatch] = useReducer(reducer, initialState(listId));

  useEffect(() => {
    (async () => {
      const todos = (await db.todos.where({ listId }).toArray()) || [];
      dispatch({ type: 'setTodos', listTitle, todos });
    })();
  }, [listId, listTitle]);

  const value: TodosState & TodosActions = {
    ...state,
    handleChange: (index) => (e) => dispatch({ type: 'onChangeTodo', index, e }),
    handleChangeNewTodo: (e) => dispatch({ type: 'onChangeNewTodo', e }),
    handleAddTodo: async () => {
      const addedTodo = { _id: mongoObjectId(), listId, title: state.newTodo.title } as Todo;
      dispatch({ type: 'addTodo', addedTodo });
      await db.todos.add(addedTodo);
    },
    handleRemoveTodo: async (_id, index) => {
      dispatch({ type: 'removeTodo', index });
      await db.todos.delete(_id);
    },
    handleUpdateTodo: async (t) => {
      await db.todos.put(t, t._id);
    }
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
};

export default TodosProvider;
