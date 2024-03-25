'use client';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/state/provider';

export const CompleteTodos = () => {
  const { completeTodos } = useTodos();

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
            value={t.title}
            todoData={t}
            disabled
          />
        ))}
      </div>
    </div>
  );
};
