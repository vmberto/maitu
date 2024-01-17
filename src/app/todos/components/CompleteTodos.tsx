'use client';

import { useContext } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { TodosContext } from '@/src/app/todos/hooks/useTodos';

export const CompleteTodos = () => {
  const { completeTodos } = useContext(TodosContext);

  if (!completeTodos.length) {
    return null;
  }

  return (
    <div id="complete-todos" className="px-5 pb-5">
      <div className="mt-5 flex align-middle text-lg font-semibold">
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
            todoData={t}
            value={t.title}
            disabled
          />
        ))}
      </div>
    </div>
  );
};
