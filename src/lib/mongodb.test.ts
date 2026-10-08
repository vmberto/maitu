import { MongoClient } from 'mongodb';
import { getMongoClient } from './mongodb';

vi.mock('mongodb', () => ({ MongoClient: vi.fn() }));
it('retries a failed connection instead of caching a rejected promise forever', async () => {
  vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/maitu');
  (global as any).mongoClientPromise = undefined;
  const client = {
    connect: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  client.connect
    .mockRejectedValueOnce(new Error('Offline database'))
    .mockResolvedValue(client);
  (MongoClient as unknown as import('vitest').Mock).mockImplementation(
    function () {
      return client;
    },
  );
  await expect(getMongoClient()).rejects.toThrow('Offline database');
  await expect(getMongoClient()).resolves.toBe(client);
  expect(client.connect).toHaveBeenCalledTimes(2);
  expect(client.close).toHaveBeenCalledTimes(1);
  (global as any).mongoClientPromise = undefined;
  vi.unstubAllEnvs();
});
