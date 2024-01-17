import { getMongoDb } from '@/src/lib/mongodb';
import type { User } from '@/types/main';

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const mongo = await getMongoDb();
  return mongo.collection('users').findOne<User>({ email });
};
