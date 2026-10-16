import { MongoClient } from 'mongodb';
import { getMongoClient } from './mongodb';

vi.mock('mongodb', () => ({ MongoClient: vi.fn() }));
vi.mock('./runtime-env.server', () => ({ workerEnv: vi.fn() }));
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

it('isolates Worker operations from stalled global and concurrent connection promises', async () => {
  const { withMongoDb } = await import('./mongodb');
  const { workerEnv } = await import('./runtime-env.server');
  vi.mocked(workerEnv).mockResolvedValue({ MONGODB_URI: 'mongodb://worker.test/maitu' });
  (global as any).mongoClientPromise = new Promise(() => {});
  let release!: () => void;
  const stalled = new Promise<void>((resolve) => { release = resolve; });
  const firstDb = { marker: 'first' }, secondDb = { marker: 'second' };
  const first = { connect: vi.fn(async () => { await stalled; }), db: vi.fn(() => firstDb), close: vi.fn().mockResolvedValue(undefined) };
  const second = { connect: vi.fn().mockResolvedValue(undefined), db: vi.fn(() => secondDb), close: vi.fn().mockResolvedValue(undefined) };
  vi.mocked(MongoClient).mockImplementationOnce(function () { return first as any; }).mockImplementationOnce(function () { return second as any; });
  const pending = withMongoDb(async (db) => db);
  await vi.waitFor(() => expect(first.connect).toHaveBeenCalledOnce());
  await expect(withMongoDb(async (db) => db)).resolves.toBe(secondDb);
  expect(second.close).toHaveBeenCalledOnce();
  expect(first.close).not.toHaveBeenCalled();
  release();
  await expect(pending).resolves.toBe(firstDb);
  expect(first.close).toHaveBeenCalledOnce();
  expect(first.db).toHaveBeenCalledWith('maitu');
  (global as any).mongoClientPromise = undefined;
  vi.mocked(workerEnv).mockResolvedValue(undefined);
});

it('closes Worker clients after query and connection failures', async () => {
  const { withMongoDb } = await import('./mongodb');
  const { workerEnv } = await import('./runtime-env.server');
  vi.mocked(workerEnv).mockResolvedValue({ MONGODB_URI: 'mongodb://worker.test/maitu' });
  for (const failure of ['connect', 'query']) {
    const client = { connect: vi.fn(), db: vi.fn(() => ({})), close: vi.fn().mockResolvedValue(undefined) };
    if (failure === 'connect') client.connect.mockRejectedValue(new Error('connection failed'));
    vi.mocked(MongoClient).mockImplementationOnce(function () { return client as any; });
    await expect(withMongoDb(async () => { throw new Error('query failed'); })).rejects.toThrow(`${failure === 'connect' ? 'connection' : 'query'} failed`);
    expect(client.close).toHaveBeenCalledOnce();
  }
  vi.mocked(workerEnv).mockResolvedValue(undefined);
});

it('keeps the existing pooled connection open across Node operations', async () => {
  const { withMongoDb } = await import('./mongodb');
  const db = {};
  const client = { db: vi.fn(() => db), close: vi.fn() };
  (global as any).mongoClientPromise = Promise.resolve(client);
  try {
    await expect(withMongoDb(async (value) => value)).resolves.toBe(db);
    await expect(withMongoDb(async (value) => value)).resolves.toBe(db);
    expect(client.db).toHaveBeenCalledTimes(2);
    expect(client.close).not.toHaveBeenCalled();
  } finally { (global as any).mongoClientPromise = undefined; }
});
