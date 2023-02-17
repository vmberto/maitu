import { TodoList } from '@/types/main';
import { getTodoLists } from '@/lib/mongo/todo-lists';
import TodoListsProvider, { TodoListsState } from '@/state/todo-lists/TodoListsProvider';
import TodoListsWrapper from '@/ui/TodoListsWrapper';
import { useEffect, useState } from 'react';
import { db } from '@/lib/local-data';

interface AppProps {
  todoLists: TodoList[];
}

export default function Home({ todoLists }: AppProps) {
  const [todoListsLocal, setTodoListsLocal] = useState([] as TodoList[]);
  useEffect(() => {
    const fetchData = async () => {
      await db.todoLists.bulkPut(todoLists);
      const tl = await db.todoLists.toArray();
      setTodoListsLocal(tl);
    };

    fetchData().catch(console.error);
  }, []);

  return (
    <TodoListsProvider todoLists={todoListsLocal}>
      <TodoListsWrapper />
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
