import { TodoList } from '@/types/main';
import { getTodoLists, syncTodoList } from '@/lib/mongo/todo-lists';
import TodoListsProvider from '@/state/todo-lists/TodoListsProvider';
import TodoListsWrapper from '@/ui/TodoListsWrapper';
import { useEffect, useState } from 'react';
import { db } from '@/lib/local-data';
import axios from 'axios';

interface AppProps {
  todoListsRemote: TodoList[];
}

export default function Home({ todoListsRemote }: AppProps) {
  const [todoListsLocal, setTodoListsLocal] = useState([] as TodoList[]);
  useEffect(() => {
    const syncData = async () => {
      await db.todoLists.bulkPut(todoListsRemote);
      const localLists = await db.todoLists.toArray();
      setTodoListsLocal(localLists);
    };

    syncData().catch(console.error);
  }, []);

  return (
    <TodoListsProvider todoLists={todoListsLocal}>
      <TodoListsWrapper />
    </TodoListsProvider>
  );
}

export async function getStaticProps() {
  const { todoLists } = await getTodoLists();
  if (todoLists) {
    return {
      props: {
        todoListsRemote: todoLists.map((item) => {
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
