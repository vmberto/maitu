import { useReducer } from 'react';
import reducer from './useTodoReducer';
import { Todo } from '@/types/TodoList';

interface InitialState {
  todosNumber: number;
  lastAction: 'add/update' | 'remove';
  todos: Todo[];
  listId: string;
}

const initialState = (todos: Todo[], listId: string) => ({
  listId,
  todos,
  todosNumber: todos.length
});

export const useActions = (todos: Todo[], listId: string) => {
  const [state, dispatch] = useReducer(reducer, initialState(todos, listId));

  const actions = {
    handleChange: (index: number) => (e: any) => dispatch({ type: 'onChangeTodo', index, e }),
    handleAddTodo: () => dispatch({ type: 'addTodo' }),
    handleRemoveTodo: (index: number) => () => dispatch({ type: 'removeTodo', index })
  };

  const re: { state: InitialState; actions: any } = { state, actions };

  return re;
};
