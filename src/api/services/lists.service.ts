import { ObjectId } from 'mongodb';
import { getMongoDb } from 'src/lib/mongodb';
import { type TodoList } from 'types/main';

export const get = async () => {
  const mongo = await getMongoDb();
  return mongo
    .collection('lists')
    .find({}, { sort: { index: 1 } })
    .toArray();
};

export const add = async (list: TodoList): Promise<TodoList> => {
  const mongo = await getMongoDb();
  const response = await mongo.collection('lists').insertOne(list);
  return { ...list, _id: response.insertedId };
};

export const update = async (listId: string, updatedList: TodoList) => {
  const mongo = await getMongoDb();
  return mongo
    .collection('lists')
    .updateOne({ _id: new ObjectId(listId) }, updatedList);
};

export const remove = async (listId: string) => {
  const mongo = await getMongoDb();
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
  const mongo = await getMongoDb();
  const items = await get();

  const [movedElement] = items.splice(initialIndex, 1);

  items.splice(destinationIndex, 0, movedElement);

  items.map((item, index) => {
    return mongo
      .collection('lists')
      .updateOne({ _id: new ObjectId(item._id) }, { $set: { index } });
  });

  await Promise.all(items);
};
