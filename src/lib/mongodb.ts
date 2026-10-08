import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

export async function getMongoClient(): Promise<MongoClient> {
  // Reuse the connection across development reloads and server requests.
  if (!(global as any).mongoClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI || '');
    // client.connect() returns an instance of MongoClient when resolved
    (global as any).mongoClientPromise = client.connect().catch((error) => {
      (global as any).mongoClientPromise = undefined;
      void client.close().catch(() => {});
      throw error;
    });
  }
  return (global as any).mongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const dbName = process.env.E2E_TEST === 'true' ? 'maitu_e2e' : 'maitu';
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}
