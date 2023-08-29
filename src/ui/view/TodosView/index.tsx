import { ArrowSmallLeftIcon } from '@heroicons/react/24/solid';
import TodoInput from 'src/ui/view/TodosView/components/TodoInput';
import { FC } from 'react';
import Link from 'next/link';
import { useHandleTodoCreation } from 'src/hooks/useHandleTodoCreation';
import { FontColor, HexColors } from 'src/utils/colorMappers';

const TodosView: FC = () => {
  const {
    todosToComplete,
    completedTodos,
    newTodo,
    selectedTodoList,
    clickScreenFocusHandler,
    handleKeyPressAdd,
    addTodo,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleCompleteTodo,
    updateTodo,
    handleInputFocus,
    handleKeyPress,
    removeFocus,
    handleClickScreen
  } = useHandleTodoCreation();

  // @Todo: Fix absolute div height (should be the same size as the screen)
  return (
    <div className="relative">
      {clickScreenFocusHandler && (
        <div className="absolute w-full h-screen" onClick={removeFocus}></div>
      )}
      <div className="min-h-screen" onClick={handleClickScreen}>
        <div className="max-w-xl my-0 mx-auto p-5">
          <div className="flex items-center">
            <Link href="../../..">
              <ArrowSmallLeftIcon
                className={`relative z-10 stroke-2 cursor-pointer h-6 w-6 mr-5`}
                color={HexColors.get(selectedTodoList.color)}
              />
            </Link>

            <h1 className={`text-2xl font-bold ${FontColor.get(selectedTodoList.color)}`}>
              {selectedTodoList?.title}
            </h1>
          </div>
          <div id="Todos" className="mt-5 mb-60">
            {todosToComplete.map((t) => (
              <TodoInput
                key={t.id}
                id={t.id}
                value={t.title}
                todoData={t}
                handleCompleteTodo={handleCompleteTodo}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyPress}
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
            <h1 className="text-sm border-t-2 pt-5 text-center font-light text-gray-500">
              Click to add new Todo
            </h1>
          </div>
          {completedTodos.length > 0 && (
            <>
              <div className="flex align-middle text-lg font-semibold mt-5">
                <h2>Complete Todos</h2>
                <span className="text-sm font-semibold ml-auto">{completedTodos.length}</span>
              </div>
              <div id="Todos">
                {completedTodos.map((t) => (
                  <TodoInput key={t.id} id={t.id} todoData={t} value={t.title} disabled />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodosView;
