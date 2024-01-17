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
    ])
    .next()) as Promise<TodosResponse>;
};

export const add = async (todo: Todo) => {
  const mongo = await getMongoDb();
  const response = await mongo
    .collection('todos')
    .insertOne({ ...todo, listId: new ObjectId(todo.listId) });
  return { ...todo, _id: response.insertedId };
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
