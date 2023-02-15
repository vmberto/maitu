import { FC, useContext } from 'react';
import { ListDemo } from '@/components/ListDemo';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';
import { Menu } from '@headlessui/react';
import { TodoList } from '@/types/main';
import { GenericEvent } from '@/types/events';

const TodoListsWrapper: FC = () => {
  const { todoLists } = useContext(TodoListsContext);
  return (
    <div className="max-w-3xl my-0 mx-auto p-5">
      {todoLists.map((list: any) => (
        <ListDemo key={list._id} {...list} />
      ))}
    </div>
  );
};

export default TodoListsWrapper;
