import TodosWrapper from '@/ui/TodosWrapper';
import { Todo, TodoList } from '@/types/TodoList';

interface TodosProps {
  existingTodos: Todo[];
  listTitle: string;
  listId: string;
}

export default function Todos(props: TodosProps) {
  return (
    <TodosWrapper
      existingTodos={props.existingTodos}
      listTitle={props.listTitle}
      listId={props.listId}
    />
  );
}

export async function getStaticPaths() {
  const res = await fetch(`${process.env.APP_URI}/api/todo-lists`);
  const { todoLists }: { todoLists: TodoList[] } = await res.json();

  const paths = todoLists.map((todo) => ({
    params: { id: todo._id }
  }));

  return { paths, fallback: false };
}

export const getStaticProps: any = async (context: any) => {
  const res = await fetch(`${process.env.APP_URI}/api/todos?listId=${context.params.id}`);
  const { result } = await res.json();
  const { _id: listId, title: listTitle, todos: existingTodos } = result;
  return {
    props: { existingTodos, listTitle, listId }
  };
};
