import { TodoListsState } from 'src/state/todo-lists/TodoListsProvider';
import { TodoList } from 'src/types/main';

export default function reducer(
  state: TodoListsState,
  action: { type: string; todoLists?: TodoList[]; newTodoList?: TodoList; listId?: string }
): TodoListsState {
  switch (action.type) {
    case 'setTodoLists': {
      return {
        ...state,
        todoLists: action.todoLists!
      };
    }
    case 'onAddTodoList': {
      const { todoLists } = state;
      const { newTodoList } = action;
      const todoListsCopy = [...todoLists];
      todoListsCopy.push(newTodoList!);
      return {
        ...state,
        todoLists: todoListsCopy
      };
    }
    case 'onDeleteTodoList': {
      const { todoLists } = state;
      const { listId } = action;
      const todoListsCopy = [...todoLists].filter((tl) => tl.id !== listId);
      return {
        ...state,
        todoLists: todoListsCopy
      };
    }
    default: {
      return state;
    }
  }
}
