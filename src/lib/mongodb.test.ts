/** @jest-environment node */
import { MongoClient } from 'mongodb';
import { getMongoClient } from './mongodb';

jest.mock('mongodb', () => ({ MongoClient: jest.fn() }));
it('retries a failed connection instead of caching a rejected promise forever', async () => {
  (global as any).mongoClientPromise = undefined;
  const client = {
    connect: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };
  client.connect
    .mockRejectedValueOnce(new Error('Offline database'))
    .mockResolvedValue(client);
  (MongoClient as unknown as jest.Mock).mockImplementation(() => client);
  await expect(getMongoClient()).rejects.toThrow('Offline database');
  await expect(getMongoClient()).resolves.toBe(client);
  expect(client.connect).toHaveBeenCalledTimes(2);
  expect(client.close).toHaveBeenCalledTimes(1);
  (global as any).mongoClientPromise = undefined;
});
