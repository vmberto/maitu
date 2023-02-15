import TodosWrapper from '@/ui/TodosWrapper';
import { getTodos } from '@/lib/mongo/todos';
import { Todo } from '@/types/main';

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

export async function getServerSideProps(context: any) {
  const { result } = await getTodos(context.params.id);
  if (result) {
    const { _id: listId, title: listTitle, todos: existingTodos } = result;
    return {
      props: { existingTodos, listTitle, listId }
    };
  } else {
    return {
      props: { existingTodos: [], listTitle: '', listId: '' }
    };
  }
}
