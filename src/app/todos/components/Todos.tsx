'use client';

import type { Ref } from 'react';
import { useContext } from 'react';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { TodosContext } from '@/src/app/todos/hooks/useTodos';
import { Typography } from '@/src/components/Typography';
import { stopPropagationFn } from '@/src/lib/functions';

type TodosProps = {
  newTodoInputRef: Ref<HTMLTextAreaElement>;
};

export const Todos = ({ newTodoInputRef }: TodosProps) => {
  const {
    todosToComplete,
    handleCompleteTodo,
    handleKeyPress,
    updateTodo,
    handleInputFocus,
    handleChangeExistingTodo,
    newTodo,
    handleChangeNewTodo,
    addTodo,
    handleKeyPressAdd,
  } = useContext(TodosContext);

  return (
    <div id="todos" className="mb-28 px-5 pb-5">
      {todosToComplete.map((t) => (
        <TodoInput
          key={t._id?.toString()}
          id={t._id?.toString()}
          value={t.title}
          todoData={t}
          handleCompleteTodo={handleCompleteTodo}
          onClick={stopPropagationFn}
          onKeyDown={handleKeyPress}
          onBlur={updateTodo(t)}
          onFocus={handleInputFocus(t)}
          onChange={handleChangeExistingTodo(t)}
        />
      ))}
      <TodoInput
        id="new-todo"
        ref={newTodoInputRef}
        value={newTodo.title}
        onChange={handleChangeNewTodo}
        onFocus={handleInputFocus(newTodo)}
        onBlur={addTodo}
        onKeyDown={handleKeyPressAdd}
      />
      <Typography
        as="h1"
        className="cursor-default border-t-2 pt-5 text-center text-sm font-light text-gray-500"
      >
        Click anywhere to add Todo
      </Typography>
    </div>
  );
};
