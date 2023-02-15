import { TodoListsState } from '@/state/todo-lists/TodoListsProvider';

export default function reducer(state: TodoListsState, action: any) {
  switch (action.type) {
    case 'onAddTodoList': {
      const { todoLists } = state;
      const { newTodoList } = action;
      const todoListsCopy = [...todoLists];
      todoListsCopy.push(newTodoList);
      return {
        ...state,
        todoLists: todoListsCopy
      };
    }
    case 'removeTodo': {
      const { todoLists } = state;
      const { todoList } = action;
      const todoListsCopy = [...todoLists].filter((_, i) => i !== todoList._id);
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
