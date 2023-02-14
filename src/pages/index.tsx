import { ListDemo } from '@/ui/ListDemo';
import { useRouter } from 'next/router';
import { TodoList } from '@/types/TodoList';
import { FC } from 'react';
import { getTodoLists } from '@/lib/mongo/todo-lists';

export async function getStaticProps() {
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

interface AppProps {
  todoLists: TodoList[];
}

const Home: FC<AppProps> = ({ todoLists }) => {
  const router = useRouter();
  return (
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
  );
};

export default Home;
