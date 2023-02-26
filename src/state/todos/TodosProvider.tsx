import { createContext, FC, useContext, useEffect, useReducer } from 'react';
import reducer from '@/state/todos/useTodoReducer';
import { Todo, TodoList } from '@/types/main';
import { GenericEvent } from '@/types/events';
import mongoObjectId from '@/lib/generateUniqueId';
import { db } from '@/lib/local-data';
import { useRouter } from 'next/router';
import { TodosDispatchActions as Actions } from '@/state/todos/actions';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';

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
  handleRemoveTodo: (_id: string) => void;
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
let timeouts = [] as { _id: string; timeout: NodeJS.Timeout }[];

interface TodosProviderProps {}
const TodosProvider: FC<TodosProviderProps> = ({ children }) => {
  const { listId } = useRouter().query;
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      if (listId) {
        const todos = (await db.todos.where({ listId }).toArray()) || [];
        const selectedTodoList = (await db.todoLists.where({ _id: listId }).first()) || {};
        dispatch({ type: Actions.SET_TODOS, selectedTodoList, todos });
      }
    })();
  }, [listId]);

  const value: TodosState & TodosActions = {
    ...state,
    handleChange: (t: Todo) => (e) => dispatch({ type: Actions.ON_CHANGE_TODO, _id: t._id, e }),
    handleChangeNewTodo: (e) => dispatch({ type: Actions.ON_CHANGE_NEW_TODO, e }),
    handleAddTodo: async () => {
      const addedTodo = {
        _id: mongoObjectId(),
        listId,
        title: state.newTodo.title,
        complete: false,
        completeDisabled: false
      } as Todo;
      dispatch({ type: Actions.ADD_TODO, addedTodo });
      await db.todos.add(addedTodo);
    },
    handleRemoveTodo: async (_id) => {
      dispatch({ type: Actions.REMOVE_TODO, _id });
      await db.todos.delete(_id);
    },
    handleUpdateTodo: async (t) => {
      await db.todos.put(t, t._id);
    },
    handleCompleteTodo: async (t) => {
      // @Todo Limpar o array de timeouts ao passar o tempo ou remover o timeout
      if (!t.complete) {
        timeouts.push({
          _id: t._id,
          timeout: setTimeout(async () => {
            dispatch({ type: Actions.COMPLETE_DISABLED_TODO, _id: t._id });
            await db.todos.put({ ...t, completeDisabled: true }, t._id);
          }, 2500)
        });
      } else {
        const timeoutObj = timeouts.find((timeout) => timeout._id === t._id);
        if (timeoutObj) clearTimeout(timeoutObj.timeout);
      }
      await db.todos.put({ ...t, complete: !t.complete }, t._id);
      dispatch({ type: Actions.COMPLETE_TODO, _id: t._id, complete: t.complete });
    }
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
};

export default TodosProvider;
