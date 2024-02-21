'use client';

import type { KeyboardEventHandler } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/provider';
import { Typography } from '@/src/components/Typography';
import { stopPropagationFn } from '@/src/lib/functions';

export const Todos = () => {
  const {
    newTodo,
    todosToComplete,
    handleAddTodo,
    handleRemoveOrUpdateTitle,
    handleInputFocus,
    handleChangeNewTodo,
    handleCompleteTodo,
    handleChangeExistingTodo,
  } = useTodos();

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAddTodo();
    }
  };

  return (
    <div className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput
          todoData={todo}
          value={todo.title}
          key={todo.createdAt}
          onClick={stopPropagationFn}
          onFocus={handleInputFocus(todo)}
          handleCompleteTodo={handleCompleteTodo}
          onBlur={handleRemoveOrUpdateTitle(todo)}
          onChange={handleChangeExistingTodo(todo)}
        />
      ))}
      <TodoInput
        id="new-todo"
        onBlur={handleAddTodo}
        value={newTodo.title}
        onKeyDown={handleKeyPressAdd}
        onChange={handleChangeNewTodo}
        onFocus={handleInputFocus(newTodo)}
      />
      <Typography
        as="h1"
        className="cursor-default border-t-2 border-gray-100 pt-5
        text-center text-sm font-light text-gray-500"
      >
        Click anywhere to add Todo
      </Typography>
    </div>
  );
};
