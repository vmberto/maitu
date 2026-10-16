import { json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { withMongoDb } from '../../../../lib/mongodb';
import { deliverReminders } from '../../../../lib/reminders.server';
import { logger } from '../../../../lib/logger';
import { runtimeEnv } from '../../../../lib/runtime-env.server';
export async function GET({ request, platform }: import('./$types').RequestEvent) {
  const env = await runtimeEnv(platform);
  const expected = `Bearer ${env.CRON_SECRET ?? ''}`, supplied = request.headers.get('authorization') ?? '';
  if (!env.CRON_SECRET || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))
    return json({ error: 'Unauthorized.' }, { status: 401 });
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
    return json({ error: 'Push delivery is not configured.' }, { status: 503 });
  try {
    return json(await withMongoDb((db) => deliverReminders(db, { publicKey: env.VAPID_PUBLIC_KEY!, privateKey: env.VAPID_PRIVATE_KEY!, subject: env.VAPID_SUBJECT! })), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    logger.error({ err: error }, 'Reminder delivery failed');
    return json({ error: 'Reminder delivery failed.' }, { status: 503 });
  }
}
