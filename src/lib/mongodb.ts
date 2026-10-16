import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { workerEnv } from './runtime-env.server';

export async function getMongoClient(): Promise<MongoClient> {
  // Reuse the connection across development reloads and server requests.
  if (!(global as any).mongoClientPromise) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    const client = new MongoClient(process.env.MONGODB_URI);
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

export async function withMongoDb<T>(operation: (db: Db) => Promise<T>): Promise<T> {
  const bindings = await workerEnv();
  if (!bindings) return operation(await getMongoDb());
  const uri = bindings.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  // Worker sockets and pending promises must not outlive their owning request.
  const client = new MongoClient(uri, { maxPoolSize: 1 });
  try {
    await client.connect();
    return await operation(client.db('maitu'));
  } finally {
    await client.close();
  }
}
