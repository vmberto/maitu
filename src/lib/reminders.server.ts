import { buildPushPayload } from '@block65/webcrypto-web-push';
import type { Db, Document } from 'mongodb';
import { createHash } from 'node:crypto';
import type { TaskReminder } from '../../types/main';

type Subscription = { endpoint: string; expirationTime: number | null; keys: { p256dh: string; auth: string } };
export type PushConfig = { publicKey: string; privateKey: string; subject: string };
export function subscriptionId(endpoint: string) { return createHash('sha256').update(endpoint).digest('hex'); }
export function validateSubscription(value: unknown): Subscription {
  const v = value as Subscription;
  let url: URL;
  try { url = new URL(v.endpoint); } catch { throw new Error('Invalid push endpoint.'); }
  // Do not let authenticated clients use the sender to request arbitrary/internal URLs.
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || url.href.length > 2048 ||
    !['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(url.hostname))
    throw new Error('Unsupported push endpoint.');
  if (!v.keys || !/^[\w-]{87}=?$/.test(v.keys.p256dh) || !/^[\w-]{22}={0,2}$/.test(v.keys.auth)) throw new Error('Invalid subscription keys.');
  return { endpoint: url.href, expirationTime: typeof v.expirationTime === 'number' ? v.expirationTime : null, keys: { p256dh: v.keys.p256dh, auth: v.keys.auth } };
}
export async function sendPush(subscription: Subscription, payload: object, config: PushConfig) {
  const request = await buildPushPayload({ data: JSON.stringify(payload), options: { ttl: 86400 } }, subscription, config);
  return fetch(subscription.endpoint, { ...request, redirect: 'manual', signal: AbortSignal.timeout(10000) });
}

// Mongo leases serialize concurrent cron runs; the browser also deduplicates delivery IDs.
export async function deliverReminders(db: Db, config: PushConfig, now = new Date(), send = sendPush) {
  const started = Date.now();
  const tasks = db.collection('todos'), lists = db.collection('lists');
  const subscriptions = db.collection<Document & { _id: string }>('pushSubscriptions');
  const deliveries = db.collection<Document & { _id: string }>('reminderDeliveries');
  await tasks.createIndex({ 'reminder.at': 1, _reminderCheckedAt: 1 });
  await subscriptions.createIndex({ owner: 1 });
  await deliveries.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const due = await tasks.find({ deleted: { $ne: true }, complete: { $ne: true }, archived: { $ne: true }, type: { $ne: 'note' },
    'reminder.at': { $lte: now.toISOString() }, 'reminder.id': { $exists: true },
    $expr: { $ne: [{ $ifNull: ['$_reminderFinished', null] }, '$reminder.id'] },
  }).sort({ _reminderCheckedAt: 1, 'reminder.at': 1 }).limit(100).toArray();
  const stats = { sent: 0, retried: 0, expired: 0 };
  for (const task of due) {
    const reminder = task.reminder as TaskReminder;
    await tasks.updateOne({ _id: task._id, 'reminder.id': reminder.id }, { $set: { _reminderCheckedAt: now } });
    const list = await lists.findOne({ _id: task.listId, deleted: { $ne: true }, archived: { $ne: true },
      ...(!task.parentTaskId ? { type: { $nin: ['notes', 'timeline'] } } : {}),
    });
    if (!list) continue;
    const devices = await subscriptions.find({ owner: list.owner }).limit(20).toArray();
    if (!devices.length) continue;
    let finished = true;
    for (const device of devices) {
      if (Date.now() - started > 45000) return stats;
      const id = `${task._id}:${reminder.id}:${device._id}`;
      try {
        await deliveries.updateOne({ _id: id }, { $setOnInsert: { status: 'pending', attempts: 0, nextAttempt: now, lockUntil: new Date(0), expiresAt: new Date(now.getTime() + 30 * 86400000) } }, { upsert: true });
      } catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
      const lease = crypto.randomUUID();
      const delivery = await deliveries.findOneAndUpdate({ _id: id, status: 'pending', nextAttempt: { $lte: now }, lockUntil: { $lte: now } },
        { $set: { lease, lockUntil: new Date(now.getTime() + 120000) }, $inc: { attempts: 1 } }, { returnDocument: 'after' });
      if (!delivery) {
        const current = await deliveries.findOne({ _id: id });
        if (!current || current.status === 'pending') finished = false;
        continue;
      }
      const current = await tasks.findOne({ _id: task._id, version: task.version, 'reminder.id': reminder.id, complete: { $ne: true }, deleted: { $ne: true }, archived: { $ne: true }, type: { $ne: 'note' } });
      const activeList = await lists.findOne({ _id: task.listId, owner: list.owner, deleted: { $ne: true }, archived: { $ne: true } });
      const activeDevice = await subscriptions.findOne({ _id: device._id, owner: list.owner });
      if (!current || !activeList || !activeDevice) {
        // A concurrent edit may only change the title; retry from the latest task on the next run.
        await deliveries.updateOne({ _id: id, lease }, { $set: { lockUntil: new Date(0) } });
        finished = false; continue;
      }
      let status = 0;
      try {
        const subscription = validateSubscription(device.subscription);
        status = (await send(subscription, { title: String(current.title).slice(0, 160), message: 'Task reminder', deliveryId: id, reminderId: reminder.id,
          taskId: String(task._id), accountId: String(list.owner), url: `/tasks?listId=${task.listId}&taskId=${task._id}` }, config)).status;
      } catch { /* Timeout/network failures are retried with the same delivery ID. */ }
      const success = status >= 200 && status < 300;
      const gone = status === 404 || status === 410;
      const permanent = gone || (status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status)) || delivery.attempts >= 8;
      if (gone) { await subscriptions.deleteOne({ _id: device._id, owner: list.owner }); stats.expired++; }
      await deliveries.updateOne({ _id: id, lease }, { $set: {
        status: success ? 'sent' : permanent ? 'failed' : 'pending', lastStatus: status, lockUntil: new Date(0),
        nextAttempt: new Date(now.getTime() + Math.min(60, 2 ** delivery.attempts) * 60000),
      } });
      if (success) stats.sent++;
      else if (!permanent) { stats.retried++; finished = false; }
    }
    if (finished) await tasks.updateOne({ _id: task._id, version: task.version, 'reminder.id': reminder.id }, { $set: { _reminderFinished: reminder.id } });
  }
  return stats;
}
