import { json } from '@sveltejs/kit';
import { session, headers } from '../../../lib/session.server';
import { getMongoDb } from '../../../lib/mongodb';
import { subscriptionId, validateSubscription } from '../../../lib/reminders.server';
import { ObjectId } from 'mongodb';
import { runtimeEnv } from '../../../lib/runtime-env.server';
import type { RequestEvent } from './$types';

async function handle(event: RequestEvent) {
  if (event.request.method !== 'GET' && event.request.headers.get('origin') !== event.url.origin)
    return json({ error: 'Invalid origin.' }, { status: 403, headers });
  const user = await session(event.cookies);
  if (!user || event.request.headers.get('X-Maitu-Account') !== user._id)
    return json({ error: 'Sign in to manage notifications.' }, { status: 401, headers });
  if (event.request.method === 'GET') {
    const env = await runtimeEnv(event.platform);
    const missing = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET'].filter((name) => !env[name]?.trim());
    if (missing.length) return json({ error: `Reminder delivery is not configured. Missing server settings: ${missing.join(', ')}.`, missing }, { status: 503, headers });
    return json({ publicKey: env.VAPID_PUBLIC_KEY }, { headers });
  }
  const text = await event.request.text();
  if (text.length > 4096) return json({ error: 'Subscription is too large.' }, { status: 413, headers });
  let input;
  try { input = JSON.parse(text); } catch { return json({ error: 'Invalid subscription.' }, { status: 400, headers }); }
  try {
    const db = await getMongoDb();
    const collection = db.collection<{ _id: string; owner: ObjectId; subscription: ReturnType<typeof validateSubscription>; updatedAt: Date }>('pushSubscriptions');
    if (event.request.method === 'DELETE') {
      if (typeof input?.endpoint !== 'string') return json({ error: 'Invalid endpoint.' }, { status: 400, headers });
      await collection.deleteOne({ _id: subscriptionId(input.endpoint), owner: new ObjectId(user._id) });
    } else {
      let subscription;
      try { subscription = validateSubscription(input); } catch (error) { return json({ error: (error as Error).message }, { status: 400, headers }); }
      const id = subscriptionId(subscription.endpoint);
      if (!(await collection.findOne({ _id: id, owner: new ObjectId(user._id) })) && await collection.countDocuments({ owner: new ObjectId(user._id) }) >= 20)
        return json({ error: 'This account already has 20 notification devices.' }, { status: 400, headers });
      await collection.updateOne({ _id: subscriptionId(subscription.endpoint) }, { $set: { owner: new ObjectId(user._id), subscription, updatedAt: new Date() } }, { upsert: true });
    }
    return json({ ok: true }, { headers });
  } catch { return json({ error: 'Could not register this notification device.' }, { status: 503, headers }); }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
