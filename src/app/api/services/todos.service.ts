import { ObjectId } from 'mongodb';

import { getMongoDb } from '@/src/lib/mongodb';
import type { Todo, TodosResponse } from '@/types/main';

export const getListTodos = async (listId: string): Promise<TodosResponse> => {
  const mongo = await getMongoDb();
  return (await mongo
    .collection('lists')
    .aggregate([
      {
        $match: { _id: new ObjectId(listId) },
      },
      {
        $lookup: {
          from: 'todos',
          localField: '_id',
          foreignField: 'listId',
          as: 'todos',
        },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     title: 1,
      //     color: 1,
      //     createdAt: 1,
      //     index: 1,
      //     owner: 1,
      //     doingTodos: {
      //       $filter: {
      //         input: '$todos',
      //         as: 'todo',
      //         cond: { $eq: ['$$todo.complete', false] },
      //       },
      //     },
      //     completeTodos: {
      //       $filter: {
      //         input: '$todos',
      //         as: 'todo',
      //         cond: { $eq: ['$$todo.complete', true] },
      //       },
      //     },
      //   },
      // },
    ])
    .next()) as Promise<TodosResponse>;
};

export const add = async (todo: Todo) => {
  const mongo = await getMongoDb();

  const newTodo: Todo = {
    ...todo,
    listId: new ObjectId(todo.listId),
  };

  const response = await mongo.collection<Todo>('todos').insertOne(newTodo);

  return { ...newTodo, _id: response.insertedId };
};

export const remove = async (id: string) => {
  const mongo = await getMongoDb();
  return mongo.collection('todos').deleteOne({ _id: new ObjectId(id) });
};

export const update = async (id: string, todo: Todo) => {
  const mongo = await getMongoDb();
  return mongo.collection('todos').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...todo,
        listId: new ObjectId(todo.listId),
        _id: new ObjectId(id),
      },
    },
  );
};
