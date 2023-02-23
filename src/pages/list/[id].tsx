import TodosWrapper from '@/ui/TodosWrapper';
import { getTodos } from '@/lib/mongo/todos';
import { Todo } from '@/types/main';
import { getTodoLists } from '@/lib/mongo/todo-lists';

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
    return {
      paths: todoLists.map((todoList) => {
        return {
          params: {
            id: todoList._id
          }
        };
      }),
      fallback: 'blocking'
    };
  } else {
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps(context: any) {
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
