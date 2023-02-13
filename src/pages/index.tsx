import { ListDemo } from '@/ui/ListDemo';
import { useRouter } from 'next/router';
import { TodoList } from '@/types/TodoList';
import { FC } from 'react';

export async function getStaticProps() {
  const res = await fetch(`${process.env.APP_URI}/api/todo-lists`);
  const { todoLists } = await res.json();
  return {
    props: { todoLists }
  };
}

interface AppProps {
  todoLists: TodoList[];
}

const Home: FC<AppProps> = ({ todoLists }) => {
  const router = useRouter();
  return (
    <div>
      <div className="max-w-3xl my-0 mx-auto p-5">
        {todoLists &&
          todoLists.map((list) => (
            <ListDemo
              key={list._id}
              title={list.title}
              onClick={() => router.push(`/list/${list._id}`)}
            />
          ))}
      </div>
    </div>
  );
};

export default Home;
