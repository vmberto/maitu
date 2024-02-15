'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

import { getSessionServerSide } from '@/src/app/api/auth/[...nextauth]/auth-options';
import { json } from '@/src/lib/functions';
import { getMongoDb } from '@/src/lib/mongodb';
import type { Todo } from '@/types/main';

export const get = async (listId: string): Promise<Todo[]> => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }

  const mongo = await getMongoDb();
  return mongo
    .collection('todos')
    .aggregate<Todo>([
      {
        $match: {
          listId: new ObjectId(listId),
        },
      },
    ])
    .toArray();
};

export const add = async (todo: Todo) => {
  const mongo = await getMongoDb();

  const newTodo: Todo = {
    ...todo,
    listId: new ObjectId(todo.listId),
  };

  const response = await mongo.collection<Todo>('todos').insertOne(newTodo);

  revalidatePath('/todos');
  return json({ ...newTodo, _id: response.insertedId });
};

export const remove = async (id: string) => {
  const mongo = await getMongoDb();

  revalidatePath('/todos');
  return mongo.collection('todos').deleteOne({ _id: new ObjectId(id) });
};

export const update = async (id: string, todo: Todo) => {
  const mongo = await getMongoDb();

  revalidatePath('/todos');
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
