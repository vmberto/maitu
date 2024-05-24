'use client';

import { NewTodoInput } from '@/src/app/todos/components/NewTodoInput';
import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/state/provider';

export const Todos = () => {
  const { todosToComplete } = useTodos();

  return (
    <div className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput key={todo.createdAt} todoData={todo} />
      ))}
      <NewTodoInput />
    </div>
  );
};
