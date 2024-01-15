import { TodoListsContext, useTodoLists } from 'src/hooks/useTodoLists';
import { Lists } from 'src/ui/view/TodoListsView/components/Lists';
import { MaituHeader } from 'src/ui/view/TodoListsView/components/MaituHeader';

import type { TodoList } from '../../../../types/main';

type TodoListsViewProps = {
  lists: TodoList[];
};

const TodoListsView = ({ lists }: TodoListsViewProps) => {
  const todoListsState = useTodoLists(lists);

  return (
    <TodoListsContext.Provider value={todoListsState}>
      <MaituHeader />
      <Lists />
    </TodoListsContext.Provider>
  );
};

export default TodoListsView;
