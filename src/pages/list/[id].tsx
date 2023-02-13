import TodosWrapper from '@/ui/TodosWrapper';
import { Todo, TodoList } from '@/types/TodoList';

interface TodosProps {
  existingTodos: Todo[];
  listId: string;
}

export default function Todos(props: TodosProps) {
  return <TodosWrapper existingTodos={props.existingTodos} listId={props.listId} />;
}

export async function getStaticPaths() {
  const res = await fetch(`http://localhost:3000/api/todo-lists`);
  const { todoLists }: { todoLists: TodoList[] } = await res.json();

  const paths = todoLists.map((todo) => ({
    params: { id: todo._id }
  }));

  return { paths, fallback: false };
}

export const getStaticProps: any = async (context: any) => {
  const res = await fetch(`http://localhost:3000/api/todos?listId=${context.params.id}`);
  const { existingTodos } = await res.json();
  return {
    props: { existingTodos, listId: context.params.id }
  };
};
