import { Todo } from '@/types/main';
import dynamic from 'next/dynamic';
const TodosWrapper = dynamic(() => import('@/ui/TodosWrapper'), { ssr: false });
const TodosProvider = dynamic(() => import('@/state/todos/TodosProvider'), { ssr: false });

interface TodosProps {
  existingTodos: Todo[];
  listTitle: string;
  listId: string;
}

export default function Todos(props: TodosProps) {
  return (
    <TodosProvider>
      <TodosWrapper />;
    </TodosProvider>
  );
}
