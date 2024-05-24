'use client';

import { NewTodoInput } from '@/src/app/todos/components/NewTodoInput';
import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/state/provider';
import { Typography } from '@/src/components/Typography';

export const Todos = () => {
  const { todosToComplete } = useTodos();

  return (
    <div className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput key={todo.createdAt} todoData={todo} />
      ))}
      <NewTodoInput />
      <Typography as="h1" className="pt-5 text-center text-sm font-light">
        Click anywhere to add Todo
      </Typography>
    </div>
  );
};
