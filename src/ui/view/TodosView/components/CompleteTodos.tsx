import { useContext } from 'react';
import { TodosContext } from 'src/context/TodosContext';
import { TodoInput } from 'src/ui/view/TodosView/components/TodoInput';

export const CompleteTodos = () => {
  const { completedTodos } = useContext(TodosContext);

  if (!completedTodos.length) {
    return null;
  }

  return (
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
  );
};
