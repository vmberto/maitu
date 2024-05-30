'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

import { getSessionServerSide } from '@/src/app/api/auth/[...nextauth]/auth-options';
import { json } from '@/src/lib/functions';
import { getMongoDb } from '@/src/lib/mongodb';
import type { Task, TasksResponse } from '@/types/main';

export const getListTasks = async (listId: string): Promise<TasksResponse> => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }

  const mongo = await getMongoDb();
  return (await mongo
    .collection('lists')
    .aggregate([
      {
        $match: {
          _id: new ObjectId(listId),
          owner: new ObjectId(authSession.user._id),
        },
      },
      {
        $lookup: {
          from: 'todos',
          localField: '_id',
          foreignField: 'listId',
          as: 'tasks',
        },
      },
    ])
    .next()) as Promise<TasksResponse>;
};

export const add = async (task: Task) => {
  const mongo = await getMongoDb();

  const newTask: Task = {
    ...task,
    listId: new ObjectId(task.listId),
  };

  const response = await mongo.collection<Task>('todos').insertOne(newTask);

  revalidatePath('/tasks');
  return json({ ...newTask, _id: response.insertedId });
};

export const remove = async (id: string) => {
  const mongo = await getMongoDb();

  revalidatePath('/tasks');
  return mongo.collection('todos').deleteOne({ _id: new ObjectId(id) });
};

export const update = async (id: string, task: Task) => {
  const mongo = await getMongoDb();

  revalidatePath('/tasks');
  return mongo.collection('todos').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...task,
        listId: new ObjectId(task.listId),
        _id: new ObjectId(id),
      },
    },
  );
};
