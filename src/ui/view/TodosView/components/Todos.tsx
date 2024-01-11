import type { Ref } from 'react';
import { useContext } from 'react';
import { TodosContext } from 'src/hooks/useTodos';
import { stopPropagationFn } from 'src/lib/functions';
import { Typography } from 'src/ui/common/Typography';
import { TodoInput } from 'src/ui/view/TodosView/components/TodoInput';

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
          key={t.id}
          id={t.id}
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
