import { ListDemo } from '@/ui/ListDemo';
import { useRouter } from 'next/router';
import { Main } from '@/types/main';
import { useState } from 'react';
import { getTodoLists } from '@/lib/mongo/todo-lists';
import SlideOver from '@/components/SlideOver';
import AddListSlideOver from '@/ui/AddListSlideOver';

interface AppProps {
  todoLists: Main[];
}

export default function Home({ todoLists }: AppProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  return (
    <div>
      <header className="flex flex-row max-w-4xl my-0 mx-auto p-2 mt-2.5 border-b-2 items-center">
        <h1 className="text-sm text-primary text-xl font-semibold">Maitu</h1>
        <button
          className="ml-auto border-2 border-primary text-primary rounded-full px-3 text-base py-0.5"
          onClick={() => setOpen(true)}>
          Add List +
        </button>
      </header>
      <div className="max-w-3xl my-0 mx-auto p-5">
        {todoLists &&
          todoLists.map((list) => (
            <ListDemo
              key={list._id}
              title={list.title}
              onClick={() => router.push(`/list/${list._id}`)}
            />
          ))}
        <SlideOver title="Adicionar Lista" open={open} setOpen={setOpen}>
          <AddListSlideOver setOpen={setOpen} />
        </SlideOver>
      </div>
    </div>
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
