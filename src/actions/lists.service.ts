'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

import { getSessionServerSide } from '@/src/app/api/auth/[...nextauth]/auth-options';
import { json } from '@/src/lib/functions';
import { getMongoDb } from '@/src/lib/mongodb';
import { type List } from '@/types/main';

export const get = async () => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }

  const mongo = await getMongoDb();

  return mongo
    .collection('lists')
    .find<List>(
      { owner: new ObjectId(authSession.user._id) },
      { sort: { index: 1 } },
    )
    .toArray();
};

export const add = async (list: List): Promise<List> => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }
  const mongo = await getMongoDb();

  const response = await mongo.collection('lists').insertOne({
    ...list,
    owner: new ObjectId(authSession.user._id),
  });

  revalidatePath('/lists');
  return json({ ...list, _id: response.insertedId });
};

export const update = async (listId: string, updatedList: List) => {
  const mongo = await getMongoDb();

  revalidatePath('/lists');
  return mongo
    .collection('lists')
    .updateOne({ _id: new ObjectId(listId) }, updatedList);
};

export const remove = async (listId: string) => {
  const mongo = await getMongoDb();

  revalidatePath('/lists');
  await mongo.collection('todos').deleteMany({ listId });
  return mongo.collection('lists').deleteOne({ _id: new ObjectId(listId) });
};

export const updateOrder = async ({
  initialIndex,
  destinationIndex,
}: {
  initialIndex: number;
  destinationIndex: number;
}) => {
  const authSession = await getSessionServerSide();

  if (!authSession) {
    throw Error();
  }

  const mongo = await getMongoDb();

  const items = await get();

  const [movedElement] = items.splice(initialIndex, 1);

  items.splice(destinationIndex, 0, movedElement);

  items.map((item, index) => {
    return mongo.collection('lists').updateOne(
      {
        _id: new ObjectId(item._id),
        owner: new ObjectId(authSession.user._id),
      },
      { $set: { index } },
    );
  });

  revalidatePath('/lists');
  await Promise.all(items);
};
