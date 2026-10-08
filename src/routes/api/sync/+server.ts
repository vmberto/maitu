import { json } from '@sveltejs/kit';
import { session, headers } from '#lib/session.server';
import { getMongoDb } from '../../../lib/mongodb';
import { applyOperation, snapshot, SyncError } from '../../../lib/sync-server';
import { logger } from '../../../lib/logger';
import type { RequestEvent } from './$types';
async function respond(event: RequestEvent, write: boolean) {
  if (write && event.request.headers.get('origin') !== event.url.origin)
    return json({ error: 'Invalid origin.' }, { status: 403, headers });
  try {
    const user = await session(event.cookies);
    if (!user || event.request.headers.get('X-Maitu-Account') !== user._id)
      return json({ error: 'Sign in to sync.' }, { status: 401, headers });
    const db = await getMongoDb();
    if (!write) return json(await snapshot(db, user._id), { headers });
    const text = await event.request.text();
    if (text.length > 100000)
      throw new SyncError('Operation is too large.', 413);
    let operation;
    try {
      operation = JSON.parse(text);
    } catch {
      throw new SyncError('Invalid JSON.');
    }
    return json(await applyOperation(db, user._id, operation), { headers });
  } catch (error) {
    if (error instanceof SyncError)
      return json({ error: error.message }, { status: error.status, headers });
    logger.error({ err: error }, 'Sync failed');
    return json(
      { error: 'Sync is temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
export const GET = (event: RequestEvent) => respond(event, false);
export const POST = (event: RequestEvent) => respond(event, true);
