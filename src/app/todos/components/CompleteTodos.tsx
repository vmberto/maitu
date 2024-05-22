'use client';

import { useEffect, useState } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodosStore } from '@/src/app/todos/state/store';
import type { Todo } from '@/types/main';

export const CompleteTodos = () => {
  const { todos } = useTodosStore();
  const [completeTodos, setCompleteTodos] = useState([] as Todo[]);

  useEffect(() => {
    setCompleteTodos(
      todos
        .filter((t) => t.completedAt)
        .sort(
          (a, b) =>
            new Date(b?.completedAt || '').getTime() -
            new Date(a?.completedAt || '').getTime(),
        ),
    );
  }, [todos]);

  if (!completeTodos.length) {
    return null;
  }

  return (
    <div id="complete-todos" className="px-5 pb-5">
      <div className="mt-5 flex border-b-2 border-gray-100 align-middle text-lg font-semibold">
        <h2>Complete Todos</h2>
        <span className="ml-auto text-sm font-semibold">
          {completeTodos.length}
        </span>
      </div>
      <div id="Todos">
        {completeTodos.map((t) => (
          <TodoInput
            key={t._id?.toString()}
            id={t._id?.toString()}
            value={t.title}
            todoData={t}
            disabled
          />
        ))}
      </div>
    </div>
  );
};
