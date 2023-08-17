import { Todo, TodoList } from 'src/types/main';
import { TodosState } from 'src/state/todos/TodosProvider';
import { TodosDispatchActions } from 'src/state/todos/actions';

export default function reducer(
  state: TodosState,
  action: {
    type: string;
    todos?: Todo[];
    id?: string;
    value?: string;
    selectedTodoList?: TodoList;
    addedTodo?: Todo;
    complete?: boolean;
  }
): TodosState {
  switch (action.type) {
    case TodosDispatchActions.SET_TODOS: {
      return {
        ...state,
        todos: action.todos!,
        selectedTodoList: action.selectedTodoList!
      };
    }
    case TodosDispatchActions.ON_CHANGE_TODO: {
      const { todos } = state;
      const { id } = action;
      const todosCopy: Todo[] = JSON.parse(JSON.stringify(todos));
      const changedTodo = todosCopy.find((t) => t.id === id);
      if (changedTodo?.id) {
        changedTodo.title = action.value!;
      }
      return {
        ...state,
        todos: todosCopy
      };
    }
    case TodosDispatchActions.ON_CHANGE_NEW_TODO: {
      const newTodoCopy = { ...state.newTodo };
      newTodoCopy.title = action.value!;
      return {
        ...state,
        newTodo: newTodoCopy
      };
    }
    case TodosDispatchActions.ADD_TODO: {
      return {
        ...state,
        newTodo: { id: '', title: '', listId: '' } as Todo
      };
    }
    case TodosDispatchActions.REMOVE_TODO: {
      const { todos } = state;
      const { id } = action;
      const todosCopy = [...todos].filter((t) => t.id !== id);
      return {
        ...state,
        todos: todosCopy
      };
    }
    case TodosDispatchActions.COMPLETE_TODO: {
      const { todos } = state;
      const { id, complete } = action;
      const todosCopy = [...todos];
      const completedTodo = todosCopy.find((t) => t.id === id);
      if (completedTodo) {
        completedTodo.complete = !complete;
      }
      return {
        ...state,
        todos: todosCopy
      };
    }
    case TodosDispatchActions.COMPLETE_DISABLED_TODO: {
      const { todos } = state;
      const { id } = action;
      const todosCopy = [...todos];
      const completedTodo = todosCopy.find((t) => t.id === id);
      if (completedTodo) {
        completedTodo.completeDisabled = true;
      }
      return {
        ...state,
        todos: todosCopy
      };
    }

    default: {
      return state;
    }
  }
}
