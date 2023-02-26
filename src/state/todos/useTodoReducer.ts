import { Todo } from '@/types/main';
import { TodosState } from '@/state/todos/TodosProvider';
import { TodosDispatchActions } from '@/state/todos/actions';

export default function reducer(state: TodosState, action: any): TodosState {
  switch (action.type) {
    case TodosDispatchActions.SET_TODOS: {
      return {
        ...state,
        todos: action.todos,
        selectedTodoList: action.selectedTodoList
      };
    }
    case TodosDispatchActions.ON_CHANGE_TODO: {
      const { todos } = state;
      const { _id, e } = action;
      const todosCopy = [...todos];
      const changedTodo = todosCopy.find((t) => t._id === _id);
      if (changedTodo) {
        const { value } = e.target;
        changedTodo.title = value;
      }
      return {
        ...state,
        todos: todosCopy
      };
    }
    case TodosDispatchActions.ON_CHANGE_NEW_TODO: {
      const { e } = action;
      const newTodoCopy = { ...state.newTodo };
      const { value } = e.target;
      newTodoCopy.title = value;
      return {
        ...state,
        newTodo: newTodoCopy
      };
    }
    case TodosDispatchActions.ADD_TODO: {
      const { todos } = state;
      const todosCopy = [...todos];
      todosCopy.push(action.addedTodo);
      return {
        ...state,
        todos: todosCopy,
        newTodo: { _id: '', title: '', listId: '' } as Todo
      };
    }
    case TodosDispatchActions.REMOVE_TODO: {
      const { todos } = state;
      const { _id } = action;
      const todosCopy = [...todos].filter((t) => t._id !== _id);
      return {
        ...state,
        todos: todosCopy
      };
    }
    case TodosDispatchActions.COMPLETE_TODO: {
      const { todos } = state;
      const { _id, complete } = action;
      const todosCopy = [...todos];
      const completedTodo = todosCopy.find((t) => t._id === _id);
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
      const { _id } = action;
      const todosCopy = [...todos];
      const completedTodo = todosCopy.find((t) => t._id === _id);
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
