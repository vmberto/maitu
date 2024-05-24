'use client';

import { useMemo } from 'react';

import { NewTodoInput } from '@/src/app/todos/components/TodosContainer/NewTodoInput';
import { TodoInput } from '@/src/app/todos/components/TodosContainer/TodoInput';
import { useTodos } from '@/src/app/todos/state/provider';

export const Todos = () => {
  const { todos } = useTodos();

  const todosToComplete = useMemo(
    () => todos.filter((t) => !t.completedAt),
    [todos],
  );

  return (
    <div className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput key={todo.createdAt} todoData={todo} />
      ))}
      <NewTodoInput />
    </div>
  );
};
