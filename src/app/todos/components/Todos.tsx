'use client';

import { TodoInput } from '@/src/app/todos/components/TodoInput';
import { useTodos } from '@/src/app/todos/provider';
import { Typography } from '@/src/components/Typography';
import { stopPropagationFn } from '@/src/lib/functions';

export const Todos = () => {
  const {
    todosToComplete,
    handleCompleteTodo,
    updateTodo,
    handleInputFocus,
    handleChangeExistingTodo,
    newTodo,
    handleChangeNewTodo,
    addTodo,
    handleKeyPressAdd,
  } = useTodos();

  return (
    <div id="todos" className="mb-28 px-5 pb-5">
      {todosToComplete.map((todo) => (
        <TodoInput
          key={todo.createdAt}
          todoData={todo}
          value={todo.title}
          handleCompleteTodo={handleCompleteTodo}
          onClick={stopPropagationFn}
          onBlur={updateTodo(todo)}
          onFocus={handleInputFocus(todo)}
          onChange={handleChangeExistingTodo(todo)}
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
