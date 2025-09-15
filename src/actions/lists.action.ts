'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

import { getSession } from '@/src/actions/auth.action';
import { json } from '@/src/lib/functions';
import { logger } from '@/src/lib/logger';
import { getMongoDb } from '@/src/lib/mongodb';
import type { List } from '@/types/main';

export const get = async () => {
  const user = await getSession();
  const mongo = await getMongoDb();

  try {
    const lists = await mongo
      .collection('lists')
      .find<List>(
        { owner: new ObjectId(user._id.toString()) },
        { sort: { index: 1 } },
      )
      .toArray();

    logger.info(
      { userId: user._id, count: lists.length },
      'Fetched lists successfully',
    );
    return lists;
  } catch (err) {
    logger.error({ err, userId: user?._id }, 'Failed to fetch lists');
    throw err;
  }
};

export const add = async (list: List): Promise<List> => {
  const user = await getSession();
  if (!user) {
    logger.warn('Unauthorized attempt to add list');
    throw new Error('Unauthorized');
  }

  const mongo = await getMongoDb();
  try {
    const response = await mongo.collection('lists').insertOne({
      ...list,
      owner: new ObjectId(user._id),
    });

    logger.info(
      { userId: user._id, listId: response.insertedId },
      'List added successfully',
    );
    revalidatePath('/');
    return json({ ...list, _id: response.insertedId });
  } catch (err) {
    logger.error({ err, userId: user._id, list }, 'Failed to add list');
    throw err;
  }
};

export const update = async (listId: string, updatedData: Partial<List>) => {
  const mongo = await getMongoDb();
  try {
    const result = await mongo
      .collection('lists')
      .updateOne({ _id: new ObjectId(listId) }, { $set: updatedData });

    logger.info(
      { listId, matched: result.matchedCount, modified: result.modifiedCount },
      'List updated successfully',
    );
    revalidatePath('/');
    return result;
  } catch (err) {
    logger.error({ err, listId, updatedData }, 'Failed to update list');
    throw err;
  }
};

export const remove = async (listId: string) => {
  const mongo = await getMongoDb();
  try {
    await mongo
      .collection('todos')
      .deleteMany({ listId: new ObjectId(listId) });
    const result = await mongo
      .collection('lists')
      .deleteOne({ _id: new ObjectId(listId) });

    logger.info(
      { listId, deleted: result.deletedCount },
      'List removed successfully',
    );
    revalidatePath('/');
    return result;
  } catch (err) {
    logger.error({ err, listId }, 'Failed to remove list');
    throw err;
  }
};

export const updateOrder = async ({
  initialIndex,
  destinationIndex,
}: {
  initialIndex: number;
  destinationIndex: number;
}) => {
  const user = await getSession();
  if (!user) {
    logger.warn('Unauthorized attempt to update order');
    throw new Error('Unauthorized');
  }

  const mongo = await getMongoDb();
  try {
    const items = await get();
    const [movedElement] = items.splice(initialIndex, 1);
    items.splice(destinationIndex, 0, movedElement);

    const updates = items.map((item, index) => {
      return mongo
        .collection('lists')
        .updateOne(
          { _id: new ObjectId(item._id), owner: new ObjectId(user._id) },
          { $set: { index } },
        );
    });

    await Promise.all(updates);
    logger.info(
      { userId: user._id, count: items.length },
      'List order updated successfully',
    );
    revalidatePath('/');
  } catch (err) {
    logger.error(
      { err, userId: user._id, initialIndex, destinationIndex },
      'Failed to update list order',
    );
    throw err;
  }
};
