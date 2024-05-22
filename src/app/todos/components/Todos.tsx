'use client';

import type { KeyboardEventHandler } from 'react';
import { useMemo } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodosStore } from '@/src/app/todos/state/store';
import { Typography } from '@/src/components/Typography';
import { useExecutionTimeout } from '@/src/hooks/useExecutionTimeout';
import { stopPropagationFn } from '@/src/lib/functions';

export const Todos = () => {
  const {
    newTodo,
    todos,
    handleAddTodo,
    handleRemoveOrUpdateTitle,
    handleInputFocus,
    handleChangeNewTodo,
    handleCompleteTodo,
    handleChangeExistingTodo,
  } = useTodosStore();

  const executionTimeout = useExecutionTimeout();

  const todosToComplete = useMemo(
    () => todos.filter((t) => !t.completedAt),
    [todos],
  );

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTodo();
    }
  };

  return (
    <div className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput
          key={todo.createdAt}
          todoData={todo}
          value={todo.title}
          onClick={stopPropagationFn}
          onFocus={() => handleInputFocus(todo)}
          handleCompleteTodo={() => handleCompleteTodo(todo, executionTimeout)}
          onBlur={() => handleRemoveOrUpdateTitle(todo)}
          onChange={handleChangeExistingTodo}
        />
      ))}
      <TodoInput
        id="new-todo"
        onBlur={handleAddTodo}
        value={newTodo.title}
        onKeyDown={handleKeyPressAdd}
        onChange={handleChangeNewTodo}
        onFocus={() => handleInputFocus(newTodo)}
      />
      <Typography
        as="h1"
        className="cursor-default pt-5 text-center text-sm font-light text-gray-500"
      >
        Click anywhere to add Todo
      </Typography>
    </div>
  );
};
