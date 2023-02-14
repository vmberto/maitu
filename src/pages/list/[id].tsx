import TodosWrapper from '@/ui/TodosWrapper';
import { getTodoLists } from '@/lib/mongo/todo-lists';
import { getTodos } from '@/lib/mongo/todos';
import { Todo } from '@/types/TodoList';

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
  const { todoLists } = await getTodoLists();
  if (todoLists) {
    const paths = todoLists.map((todo) => ({
      params: { id: todo._id }
    }));
    return { paths, fallback: false };
  }
  return { paths: [], fallback: false };
}

export async function getStaticProps(context: any) {
  const { result } = await getTodos(context.params.id);
  const { _id: listId, title: listTitle, todos: existingTodos } = result;
  return {
    props: { existingTodos, listTitle, listId }
  };
}
