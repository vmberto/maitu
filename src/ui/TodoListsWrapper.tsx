import { FC, useContext, useEffect, useState } from 'react';
import { ListDemo } from '@/components/ListDemo';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';
import { Menu } from '@headlessui/react';
import { TodoList } from '@/types/main';
import { GenericEvent } from '@/types/events';
import AddListSlideOver from '@/ui/AddListSlideOver';
import SlideOver from '@/components/SlideOver';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/local-data';
import Link from 'next/link';

const TodoListsWrapper: FC = () => {
  const [open, setOpen] = useState(false);
  const { todoLists } = useContext(TodoListsContext);
  return (
    <>
      <header className="flex flex-row max-w-3xl my-0 mx-auto py-2 px-6 mt-2.5 border-b-2 items-center">
        <h1 className="text-sm text-primary text-xl font-semibold">Maitu</h1>
        <button
          className="ml-auto border-2 border-primary text-primary rounded-full px-3 text-base py-0.5"
          onClick={() => setOpen(true)}>
          Add List +
        </button>
      </header>
      <div className="max-w-2xl mt-0 mb-60 mx-auto p-5">
        {todoLists.map((list) => (
          <ListDemo key={list._id} {...list} />
        ))}
      </div>
      <SlideOver title="Adicionar Lista" open={open} setOpen={setOpen}>
        <AddListSlideOver setOpen={setOpen} />
      </SlideOver>
    </>
  );
};

export default TodoListsWrapper;
