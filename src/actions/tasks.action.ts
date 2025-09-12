'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

import { getSession } from '@/src/actions/auth.action';
import { json } from '@/src/lib/functions';
import { logger } from '@/src/lib/logger';
import { getMongoDb } from '@/src/lib/mongodb';
import type { Task, TasksResponse } from '@/types/main';

export const getListTasks = async (listId: string): Promise<TasksResponse> => {
  const user = await getSession();
  if (!user) {
    logger.warn({ listId }, 'Unauthorized access to getListTasks');
    throw new Error('Unauthorized');
  }

  const mongo = await getMongoDb();
  try {
    const result = await mongo
      .collection('lists')
      .aggregate([
        {
          $match: {
            _id: new ObjectId(listId),
            owner: new ObjectId(user._id),
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
      .next();

    logger.info(
      { userId: user._id, listId },
      'Fetched list tasks successfully',
    );
    return result as TasksResponse;
  } catch (err) {
    logger.error(
      { err, userId: user._id, listId },
      'Failed to fetch list tasks',
    );
    throw err;
  }
};

export const getSubTasks = async (taskId: string): Promise<Task[]> => {
  const user = await getSession();
  if (!user) {
    logger.warn({ taskId }, 'Unauthorized access to getSubTasks');
    throw new Error('Unauthorized');
  }

  const mongo = await getMongoDb();
  try {
    logger.info({ userId: user._id, taskId }, 'Fetching subtasks');
    const result = await mongo
      .collection<Task[]>('todos')
      .aggregate([{ $match: { parentTaskId: new ObjectId(taskId) } }])
      .toArray();

    logger.info(
      { userId: user._id, taskId, count: result.length },
      'Fetched subtasks successfully',
    );
    return result as Task[];
  } catch (err) {
    logger.error({ err, userId: user._id, taskId }, 'Failed to fetch subtasks');
    throw err;
  }
};

export const add = async (task: Task): Promise<Task> => {
  const mongo = await getMongoDb();
  const newTask: Task = {
    ...task,
    listId: new ObjectId(task.listId),
  };

  if (task.parentTaskId) {
    newTask.parentTaskId = new ObjectId(task.parentTaskId);
  }

  try {
    const response = await mongo.collection<Task>('todos').insertOne(newTask);

    logger.info(
      { taskId: response.insertedId, listId: newTask.listId },
      'Task added successfully',
    );
    revalidatePath('/tasks');
    return json({ ...newTask, _id: response.insertedId });
  } catch (err) {
    logger.error({ err, task }, 'Failed to add task');
    throw err;
  }
};

export const remove = async (id: string) => {
  const mongo = await getMongoDb();
  try {
    await mongo
      .collection('todos')
      .deleteMany({ parentTaskId: new ObjectId(id) });
    const result = await mongo
      .collection('todos')
      .deleteOne({ _id: new ObjectId(id) });

    logger.info(
      { taskId: id, deleted: result.deletedCount },
      'Task removed successfully',
    );
    revalidatePath('/tasks');
    return result;
  } catch (err) {
    logger.error({ err, taskId: id }, 'Failed to remove task');
    throw err;
  }
};

export const update = async (id: string, task: Task) => {
  const mongo = await getMongoDb();
  try {
    const result = await mongo.collection('todos').updateOne(
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

    logger.info(
      {
        taskId: id,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
      'Task updated successfully',
    );
    revalidatePath('/tasks');
    return result;
  } catch (err) {
    logger.error({ err, taskId: id, task }, 'Failed to update task');
    throw err;
  }
};
