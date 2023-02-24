import dynamic from 'next/dynamic';
import { NextPageContext } from 'next';
const TodosWrapper = dynamic(() => import('@/ui/TodosWrapper'), { ssr: false });
const TodosProvider = dynamic(() => import('@/state/todos/TodosProvider'), { ssr: false });

export default function Todos() {
  return (
    <TodosProvider>
      <TodosWrapper />;
    </TodosProvider>
  );
}
