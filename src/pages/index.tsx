import { TodoList } from '@/types/main';
import { useState } from 'react';
import { getTodoLists } from '@/lib/mongo/todo-lists';
import SlideOver from '@/components/SlideOver';
import AddListSlideOver from '@/ui/AddListSlideOver';
import TodoListsProvider from '@/state/todo-lists/TodoListsProvider';
import TodoListsWrapper from '@/ui/TodoListsWrapper';

interface AppProps {
  todoLists: TodoList[];
}

export default function Home({ todoLists }: AppProps) {
  const [open, setOpen] = useState(false);

  return (
    <TodoListsProvider todoLists={todoLists}>
      <header className="flex flex-row max-w-3xl my-0 mx-auto py-2 px-6 mt-2.5 border-b-2 items-center">
        <h1 className="text-sm text-primary text-xl font-semibold">Maitu</h1>
        <button
          className="ml-auto border-2 border-primary text-primary rounded-full px-3 text-base py-0.5"
          onClick={() => setOpen(true)}>
          Add List +
        </button>
      </header>
      <TodoListsWrapper />
      <SlideOver title="Adicionar Lista" open={open} setOpen={setOpen}>
        <AddListSlideOver setOpen={setOpen} />
      </SlideOver>
    </TodoListsProvider>
  );
}

export async function getServerSideProps() {
  const { todoLists } = await getTodoLists();
  if (todoLists) {
    return {
      props: {
        todoLists: todoLists.map((item) => {
          return {
            ...item,
            _id: item._id.toString()
          };
        })
      }
    };
  } else {
    return { props: {} };
  }
}
