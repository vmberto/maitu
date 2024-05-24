'use client';

import { useMemo } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodosContainer/TodoInput';
import { useTodos } from '@/src/app/todos/state/provider';

export const CompleteTodos = () => {
  const { todos } = useTodos();

  const completeTodos = useMemo(
    () =>
      todos
        .filter((t) => t.completedAt)
        .sort(
          (a, b) =>
            new Date(b?.completedAt || '').getTime() -
            new Date(a?.completedAt || '').getTime(),
        ),
    [todos],
  );

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
          <TodoInput key={t._id?.toString()} todoData={t} disabled />
        ))}
      </div>
    </div>
  );
};
