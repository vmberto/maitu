import { GET } from './+server';
const mocks = vi.hoisted(() => ({ db: vi.fn(), deliver: vi.fn() }));
vi.mock('../../../../lib/mongodb', () => ({ getMongoDb: mocks.db }));
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
  expect(await result.json()).toEqual({ sent: 2, retried: 0, expired: 0 });
  expect(mocks.deliver).toHaveBeenCalledWith(db, { publicKey: 'configured', privateKey: 'configured', subject: 'configured' });
});
