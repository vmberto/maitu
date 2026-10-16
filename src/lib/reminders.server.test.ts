import { ObjectId, type Db } from 'mongodb';
import { deliverReminders, validateSubscription, sendPush } from './reminders.server';

const owner = new ObjectId(), listId = new ObjectId();
const now = new Date('2026-10-14T12:00:00.000Z');
const reminder = { id: '00000000-0000-4000-8000-000000000001', at: now.toISOString(), timeZone: 'UTC' };
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/device', expirationTime: null, keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } };
const config = { publicKey: '', privateKey: '', subject: 'mailto:test@example.com' };
function database() {
  const task: any = { _id: new ObjectId(), listId, version: 1, title: 'Task', reminder };
  const records = new Map<string, any>();
  let archived = false;
  const devices: any[] = [{ _id: 'device1', owner, subscription }, { _id: 'device2', owner, subscription }];
  const taskActive = () => !task.deleted && !task.complete && !task.archived && task.type !== 'note' && task.reminder && task.reminder.at <= now.toISOString() && task._reminderFinished !== task.reminder.id;
  const tasks = {
    createIndex: vi.fn(),
    find: () => ({ sort: () => ({ limit: () => ({ toArray: async () => taskActive() ? [{ ...task }] : [] }) }) }),
    findOne: vi.fn(async (filter) => taskActive() && filter['reminder.id'] === task.reminder.id && filter.version === task.version ? task : null),
    updateOne: vi.fn(async (filter, update) => { if (filter['reminder.id'] === task.reminder?.id && (filter.version === undefined || filter.version === task.version)) Object.assign(task, update.$set); }),
  };
  const lists = { findOne: vi.fn(async () => archived ? null : { _id: listId, owner }) };
  const subscriptions = {
    createIndex: vi.fn(), find: () => ({ limit: () => ({ toArray: async () => [...devices] }) }),
    findOne: async (filter: any) => devices.find((device) => device._id === filter._id),
    deleteOne: vi.fn(async (filter) => { const index = devices.findIndex((device) => device._id === filter._id); if (index >= 0) devices.splice(index, 1); }),
  };
  const deliveries = {
    createIndex: vi.fn(),
    updateOne: vi.fn(async (filter, update) => {
      if (!records.has(filter._id) && update.$setOnInsert) records.set(filter._id, { ...update.$setOnInsert });
      const record = records.get(filter._id);
      if (record && (!filter.lease || record.lease === filter.lease)) Object.assign(record, update.$set);
    }),
    findOne: async (filter: any) => records.get(filter._id),
    findOneAndUpdate: async (filter: any, update: any) => {
      const record = records.get(filter._id);
      if (!record || record.status !== filter.status || record.nextAttempt > filter.nextAttempt.$lte || record.lockUntil > filter.lockUntil.$lte) return null;
      Object.assign(record, update.$set); record.attempts++;
      return { ...record };
    },
  };
  const collections: any = { todos: tasks, lists, pushSubscriptions: subscriptions, reminderDeliveries: deliveries };
  return { db: { collection: (name: string) => collections[name] } as unknown as Db, task, tasks, records, subscriptions, setArchived: () => archived = true };
}
it('sends once per device and prevents duplicate delivery across repeated and concurrent runs', async () => {
  const { db } = database();
  const send = vi.fn<typeof sendPush>(async () => new Response(null, { status: 201 }));
  await Promise.all([deliverReminders(db, config, now, send), deliverReminders(db, config, now, send)]);
  await deliverReminders(db, config, now, send);
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0][1]).toMatchObject({ title: 'Task', url: expect.stringContaining('&taskId=') });
});
it('retries a failed device without resending successful devices and removes expired subscriptions', async () => {
  const { db, records, subscriptions } = database();
  const send = vi.fn().mockResolvedValueOnce(new Response(null, { status: 201 })).mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValue(new Response(null, { status: 410 }));
  expect(await deliverReminders(db, config, now, send)).toMatchObject({ sent: 1, retried: 1 });
  await deliverReminders(db, config, new Date(now.getTime() + 60000), send);
  expect(send).toHaveBeenCalledTimes(2);
  expect(await deliverReminders(db, config, new Date(now.getTime() + 180000), send)).toMatchObject({ expired: 1 });
  expect(send).toHaveBeenCalledTimes(3);
  expect(subscriptions.deleteOne).toHaveBeenCalledTimes(1);
  expect([...records.values()].map((record) => record.status)).toEqual(['sent', 'failed']);
});
it.each(['complete', 'deleted', 'archived', 'removed', 'rescheduled', 'listArchived'])('cancels %s tasks before delivery', async (action) => {
  const fixture = database(), send = vi.fn(async () => new Response(null, { status: 201 }));
  if (action === 'removed') fixture.task.reminder = null;
  else if (action === 'rescheduled') fixture.task.reminder = { ...reminder, at: '2026-10-20T12:00:00.000Z' };
  else if (action === 'listArchived') fixture.setArchived();
  else fixture.task[action] = true;
  await deliverReminders(fixture.db, config, now, send);
  expect(send).not.toHaveBeenCalled();
});
it('rechecks completion after claiming the delivery lease', async () => {
  const fixture = database(), send = vi.fn(async () => new Response(null, { status: 201 }));
  fixture.tasks.findOne.mockImplementation(async () => { fixture.task.complete = true; return null; });
  await deliverReminders(fixture.db, config, now, send);
  expect(send).not.toHaveBeenCalled();
});
it('rejects arbitrary endpoints and malformed encryption keys', () => {
  expect(validateSubscription(subscription)).toEqual(subscription);
  for (const endpoint of ['http://fcm.googleapis.com/send', 'https://localhost/send', 'https://fcm.googleapis.com.attacker.test/send', 'https://fcm.googleapis.com:444/send'])
    expect(() => validateSubscription({ ...subscription, endpoint })).toThrow();
  expect(() => validateSubscription({ ...subscription, keys: {} })).toThrow();
});
it('encrypts an actual Web Push request and signs it with VAPID', async () => {
  const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const device = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const privateKey = (await crypto.subtle.exportKey('jwk', vapid.privateKey)).d!;
  const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', vapid.publicKey)).toString('base64url');
  const p256dh = Buffer.from(await crypto.subtle.exportKey('raw', device.publicKey)).toString('base64url');
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  try {
    await sendPush({ ...subscription, keys: { p256dh, auth: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url') } }, { title: 'Encrypted task' }, { ...config, publicKey, privateKey });
    const request = fetchMock.mock.calls[0][1] as any;
    expect(request.method.toUpperCase()).toBe('POST');
    expect(request.redirect).toBe('manual');
    expect(request.headers['content-encoding']).toBe('aes128gcm');
    expect(request.headers.authorization).toMatch(/^vapid /);
    expect(Buffer.from(request.body).includes(Buffer.from('Encrypted task'))).toBe(false);
  } finally { vi.unstubAllGlobals(); }
});
