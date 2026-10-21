import { GET } from './+server';
const mocks = vi.hoisted(() => ({ db: vi.fn(), deliver: vi.fn(), recur: vi.fn().mockResolvedValue({ created: 0 }) }));
vi.mock('../../../../lib/mongodb', () => ({ withMongoDb: async (operation: (db: any) => unknown) => operation(await mocks.db()) }));
vi.mock('../../../../lib/recurrence.server', () => ({ generateRecurringTasks: mocks.recur }));
vi.mock('../../../../lib/reminders.server', () => ({ deliverReminders: mocks.deliver }));
function event(secret: string) { return { request: new Request('https://maitu.test/api/reminders/run', { headers: { authorization: secret } }) } as any; }
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'private-test-secret');
  for (const name of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) vi.stubEnv(name, 'configured');
});
afterEach(() => vi.unstubAllEnvs());
it('requires the cron secret before accessing data, including malformed Unicode headers', async () => {
  for (const value of ['', 'Bearer wrong-secret', 'Bearer ' + 'é'.repeat(19)]) expect((await GET(event(value))).status).toBe(401);
  expect(mocks.db).not.toHaveBeenCalled();
  expect(mocks.deliver).not.toHaveBeenCalled();
});
it('runs delivery with server keys only for authorized requests', async () => {
  const db = {}; mocks.db.mockResolvedValue(db); mocks.deliver.mockResolvedValue({ sent: 2, retried: 0, expired: 0 });
  const result = await GET(event('Bearer private-test-secret'));
  expect(await result.json()).toEqual({ sent: 2, retried: 0, expired: 0, created: 0 });
  expect(mocks.deliver).toHaveBeenCalledWith(db, { publicKey: 'configured', privateKey: 'configured', subject: 'configured' });
});

it('authorizes and configures reminder delivery from Cloudflare runtime bindings', async () => {
  const db = {};
  mocks.db.mockResolvedValue(db);
  mocks.deliver.mockResolvedValue({ sent: 1 });
  const request = event('Bearer worker-secret');
  request.platform = { env: { CRON_SECRET: 'worker-secret', VAPID_PUBLIC_KEY: 'worker-public', VAPID_PRIVATE_KEY: 'worker-private', VAPID_SUBJECT: 'mailto:test@example.com' } };
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ sent: 1, created: 0 });
  expect(mocks.deliver).toHaveBeenCalledWith(db, { publicKey: 'worker-public', privateKey: 'worker-private', subject: 'mailto:test@example.com' });
});

it('generates recurring tasks even when push delivery is not configured', async () => {
  vi.stubEnv('VAPID_PUBLIC_KEY', '');
  mocks.db.mockResolvedValue({});
  mocks.recur.mockResolvedValueOnce({ created: 2 });
  const response = await GET(event('Bearer private-test-secret'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ created: 2 });
  expect(mocks.deliver).not.toHaveBeenCalled();
});
