'use client';

import { useEffect } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/provider';
import { Typography } from '@/src/components/Typography';
import { stopPropagationFn } from '@/src/lib/functions';
import type { Todo } from '@/types/main';

type TodosProps = {
  todos: Todo[];
};

export const Todos = ({ todos }: TodosProps) => {
  const {
    todosToComplete,
    handleCompleteTodo,
    updateTodo,
    handleSetTodos,
    handleInputFocus,
    handleChangeExistingTodo,
    newTodo,
    handleChangeNewTodo,
    addTodo,
    handleKeyPressAdd,
  } = useTodos();

  useEffect(() => {
    handleSetTodos(todos);
  }, [todos, handleSetTodos]);

  return (
    <div id="todos" className="mb-28 px-5 pb-5">
      {todosToComplete.map((t) => (
        <TodoInput
          key={t._id?.toString() || t.createdAt.toString()}
          id={t._id?.toString()}
          value={t.title}
          todoData={t}
          handleCompleteTodo={handleCompleteTodo}
          onClick={stopPropagationFn}
          onBlur={updateTodo(t)}
          onFocus={handleInputFocus(t)}
          onChange={handleChangeExistingTodo(t)}
        />
      ))}
      <TodoInput
        id="new-todo"
        value={newTodo.title}
        onChange={handleChangeNewTodo}
        onFocus={handleInputFocus(newTodo)}
        onBlur={addTodo}
        onKeyDown={handleKeyPressAdd}
      />
      <Typography
        as="h1"
        className="cursor-default border-t-2 border-gray-100 pt-5 text-center text-sm font-light text-gray-500"
      >
        Click anywhere to add Todo
      </Typography>
    </div>
  );
};
