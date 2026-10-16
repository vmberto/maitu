import { GET, POST, DELETE } from './+server';
import { ObjectId } from 'mongodb';
const userId = '507f191e810c19729de860ea';
const mocks = vi.hoisted(() => ({ session: vi.fn(), getDb: vi.fn(), update: vi.fn(), remove: vi.fn(), find: vi.fn(), count: vi.fn() }));
vi.mock('../../../lib/session.server', () => ({ session: mocks.session, headers: { 'Cache-Control': 'private, no-store' } }));
vi.mock('../../../lib/mongodb', () => ({ withMongoDb: async (operation: (db: any) => unknown) => operation(await mocks.getDb()) }));
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/device', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } };
function event(method: string, body = subscription, account = userId, origin = 'https://maitu.test') {
  return { request: new Request('https://maitu.test/api/push', { method, headers: { origin, 'X-Maitu-Account': account }, ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}) }), url: new URL('https://maitu.test/api/push'), cookies: {} } as any;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ _id: userId });
  mocks.find.mockResolvedValue(null); mocks.count.mockResolvedValue(0);
  mocks.getDb.mockResolvedValue({ collection: () => ({ updateOne: mocks.update, deleteOne: mocks.remove, findOne: mocks.find, countDocuments: mocks.count }) });
  for (const name of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET']) vi.stubEnv(name, 'configured');
});
afterEach(() => vi.unstubAllEnvs());
it('requires the signed-in account and same origin for writes', async () => {
  expect((await GET(event('GET', subscription, 'another-account'))).status).toBe(401);
  expect((await POST(event('POST', subscription, userId, 'https://attacker.test'))).status).toBe(403);
  expect(mocks.update).not.toHaveBeenCalled();
});
it('publishes only the public key and reports missing delivery configuration', async () => {
  expect(await (await GET(event('GET'))).json()).toEqual({ publicKey: 'configured' });
  vi.stubEnv('VAPID_PRIVATE_KEY', 'private-value-never-expose');
  vi.stubEnv('CRON_SECRET', '');
  const response = await GET(event('GET'));
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.missing).toEqual(['CRON_SECRET']);
  expect(body.error).toContain('Missing server settings: CRON_SECRET');
  expect(JSON.stringify(body)).not.toContain('private-value-never-expose');
});
it('registers validated subscriptions under the signed-in account and scopes deletion by ownership', async () => {
  expect((await POST(event('POST'))).status).toBe(200);
  expect(mocks.update.mock.calls[0][1].$set.owner).toEqual(new ObjectId(userId));
  expect(mocks.update.mock.calls[0][1].$set.subscription.endpoint).toBe(subscription.endpoint);
  expect((await DELETE(event('DELETE'))).status).toBe(200);
  expect(mocks.remove.mock.calls[0][0].owner).toEqual(new ObjectId(userId));
});
it('rejects arbitrary URLs and enforces the device limit', async () => {
  expect((await POST(event('POST', { ...subscription, endpoint: 'https://localhost/internal' }))).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
  mocks.count.mockResolvedValue(20);
  expect((await POST(event('POST'))).status).toBe(400);
});

it('reads configured Cloudflare Worker bindings without relying on process.env', async () => {
  const env: Record<string, string> = {};
  for (const key of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET']) {
    vi.stubEnv(key, '');
    env[key] = key === 'VAPID_PUBLIC_KEY' ? 'worker-public-key' : 'private-worker-value';
  }
  const request = event('GET');
  request.platform = { env };
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ publicKey: 'worker-public-key' });
});
