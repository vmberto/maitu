import { useState } from 'react';
import { Todo, TodoList } from 'src/types/main';
import { TextareaChangeEventHandler } from 'src/types/events';
import { useRouter } from 'next/router';
import * as TodosDb from 'src/lib/database/todosDb';
import { useLiveQuery } from 'dexie-react-hooks';

let timeouts = [] as { id: string; timeout: NodeJS.Timeout }[];

export const useTodos = () => {
  const { listId } = useRouter().query;
  const [todos, setTodos] = useState<Todo[]>([] as Todo[]);
  const [selectedTodoList, setSelectedTodoList] = useState<TodoList>({} as TodoList);
  const [newTodo, setNewTodo] = useState<Todo>({} as Todo);

  useLiveQuery(() => {
    (async () => {
      if (listId) {
        const { selectedTodoList, todos } = await TodosDb.get(listId);
        setTodos(todos);
        setSelectedTodoList(selectedTodoList);
      }
    })();
  }, [listId]);

  const handleChangeExistingTodo = (todo: Todo) => (e: TextareaChangeEventHandler) => {
    const { value } = e.target;
    const { id } = todo;
    const todosCopy: Todo[] = JSON.parse(JSON.stringify(todos));
    const changedTodo = todosCopy.find((t) => t.id === id);
    if (changedTodo?.id) {
      changedTodo.title = value!;
    }
    setTodos(todosCopy);
  };

  const handleChangeNewTodo = (e: TextareaChangeEventHandler) => {
    const newTodoCopy: Todo = { ...newTodo };
    const { value } = e.target;
    newTodoCopy.title = value!;
    setNewTodo(newTodoCopy);
  };

  const handleUpdateTodo = async (todo: Todo) => {
    await TodosDb.update(todo.id, todo);
  };

  const handleRemoveTodo = async (id: string) => {
    await TodosDb.remove(id);
  };

  const handleAddTodo = async () => {
    const addedTodo = {
      listId,
      title: newTodo.title,
      complete: false,
      completeDisabled: false,
      createdAt: new Date()
    } as Todo;
    setNewTodo({ title: '' } as Todo);
    await TodosDb.add(addedTodo);
  };

  const handleCompleteTodo = async (t: Todo) => {
    if (!t.complete) {
      timeouts.push({
        id: t.id,
        timeout: setTimeout(async () => {
          await TodosDb.update(t.id, { ...t, complete: true, completeDisabled: true });
        }, 2000)
      });
    } else {
      const timeoutObj = timeouts.find((timeout) => timeout.id === t.id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        timeouts = timeouts.filter((t) => t.id !== timeoutObj.id);
      }
    }
    await TodosDb.update(t.id, { ...t, complete: !t.complete });
  };

  return {
    listId,
    todos,
    selectedTodoList,
    newTodo,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleAddTodo,
    handleRemoveTodo,
    handleUpdateTodo,
    handleCompleteTodo
  };
};
