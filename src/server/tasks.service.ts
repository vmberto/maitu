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
          let: { listId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$listId', '$$listId'] },
                    { $eq: ['$parentTaskId', null] },
                  ],
                },
              },
            },
          ],
          as: 'tasks',
        },
      },
    ])
    .next()) as Promise<TasksResponse>;
};

export const getSubTasks = async (taskId: string): Promise<Task[]> => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }

  const mongo = await getMongoDb();
  return (await mongo
    .collection<Task[]>('todos')
    .aggregate([
      {
        $match: {
          parentTaskId: new ObjectId(taskId),
        },
      },
    ])
    .toArray()) as Task[];
};

export const add = async (task: Task) => {
  const mongo = await getMongoDb();

  const newTask: Task = {
    ...task,
    listId: new ObjectId(task.listId),
  };

  if (task.parentTaskId) {
    newTask.parentTaskId = new ObjectId(task.parentTaskId);
  }

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
        parentTaskId: task.parentTaskId
          ? new ObjectId(task.parentTaskId)
          : undefined,
        _id: new ObjectId(id),
      },
    },
  );
};
