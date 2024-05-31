import { getMongoDb } from '@/src/lib/mongodb';
import type { UserObject } from '@/types/main';

export const getUserByEmail = async (
  email: string,
): Promise<UserObject | null> => {
  const mongo = await getMongoDb();
  return mongo.collection('users').findOne<UserObject>({ email });
};
