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
  return (
    <TodoListsProvider todoLists={todoLists}>
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
