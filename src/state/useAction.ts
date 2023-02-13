import { useReducer } from 'react';
import reducer from './useTodoReducer';
import { Todo } from '@/types/TodoList';

interface InitialState {
  todosNumber: number;
  todos: Todo[];
  listId: string;
  newTodo: Todo;
  isAddingTodo: boolean;
}

const initialState = (todos: Todo[], listId: string) => ({
  listId,
  todos,
  todosNumber: todos.length,
  newTodo: {} as Todo,
  isAddingTodo: false
});

export const useActions = (todos: Todo[], listId: string) => {
  const [state, dispatch] = useReducer(reducer, initialState(todos, listId));

  const actions = {
    handleChange: (index: number) => (e: any) => dispatch({ type: 'onChangeTodo', index, e }),
    handleChangeNewTodo: (e: any) => dispatch({ type: 'onChangeNewTodo', e }),
    handleAddTodo: () => {
      dispatch({ type: 'addTodo', listId });
    },
    handleIsAddingTodo: (value: boolean) => dispatch({ type: 'isAddingTodo', value }),
    handleRemoveTodo: (index: number) => () => dispatch({ type: 'removeTodo', index })
  };

  const re: { state: InitialState; actions: any } = { state, actions };

  return re;
};
