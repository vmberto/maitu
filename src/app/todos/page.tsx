import React, { Suspense } from 'react';

import { CompleteTodos } from '@/src/app/todos/components/CompleteTodos';
import { HeaderContainer } from '@/src/app/todos/components/HeaderContainer';
import HeaderLoading from '@/src/app/todos/components/Loading/HeaderLoading';
import TodosLoading from '@/src/app/todos/components/Loading/TodosLoading';
import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { TodosContainer } from '@/src/app/todos/components/TodosContainer';
import { TodosProvider } from '@/src/app/todos/provider';

type TodosPageProps = {
  searchParams: { listId: string };
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  return (
    <TodosProvider>
      <main className="mx-auto my-0 h-full max-w-xl">
        <Suspense fallback={<HeaderLoading />}>
          <HeaderContainer listId={searchParams.listId} />
        </Suspense>

        <Suspense fallback={<TodosLoading />}>
          <TodosContainer listId={searchParams.listId} />
        </Suspense>

        <CompleteTodos />

        <TodoDetailSlideOver />
      </main>
    </TodosProvider>
  );
}
