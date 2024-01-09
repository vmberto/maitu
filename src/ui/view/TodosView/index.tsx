/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRef } from 'react';
import { useTodos } from 'src/hooks/useTodos';
import { FontColor, HexColors } from 'src/lib/colors';
import { stopPropagationFn } from 'src/lib/functions';
import { TodoInput } from 'src/ui/view/TodosView/components/TodoInput';

const TodosView = () => {
  const newTodoInputRef = useRef({} as HTMLTextAreaElement);
  const {
    todosToComplete,
    completedTodos,
    newTodo,
    selectedTodoList,
    clickScreenFocusHandler,
    handleKeyPressAdd,
    addTodo,
    handleChangeExistingTodo,
    updateTodosOrder,
    handleChangeNewTodo,
    handleCompleteTodo,
    updateTodo,
    handleInputFocus,
    handleKeyPress,
    removeFocus,
    handleClickScreen,
  } = useTodos(newTodoInputRef.current);

  return (
    <div className="relative" onClick={handleClickScreen}>
      {clickScreenFocusHandler && (
        <div className="absolute h-full w-full" onClick={removeFocus} />
      )}
      <div className="mx-auto my-0 max-w-xl">
        <div className="flex items-center py-2">
          <Link
            className="flex h-12 pl-5"
            onClick={stopPropagationFn}
            href=".."
          >
            <ArrowLeftIcon
              className="relative mr-3 w-6 cursor-pointer"
              color={HexColors.get(selectedTodoList.color)}
            />
          </Link>
          <h1
            className={`pr-5 text-2xl font-bold ${FontColor.get(
              selectedTodoList.color,
            )}`}
          >
            {selectedTodoList?.title}
          </h1>
        </div>
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
          <h1 className="cursor-default border-t-2 pt-5 text-center text-sm font-light text-gray-500">
            Click anywhere to add Todo
          </h1>
        </div>
        {!(completedTodos.length === 0) && (
          <div id="complete-todos" className="px-5 pb-5">
            <div className="mt-5 flex align-middle text-lg font-semibold">
              <h2>Complete Todos</h2>
              <span className="ml-auto text-sm font-semibold">
                {completedTodos.length}
              </span>
            </div>
            <div id="Todos">
              {completedTodos.map((t) => (
                <TodoInput
                  key={t.id}
                  id={t.id}
                  todoData={t}
                  value={t.title}
                  disabled
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodosView;
