import { isAuthenticated } from '@/src/lib/session';
import { logger } from '@/src/lib/logger';
import { getMongoDb } from '@/src/lib/mongodb';
import { applyOperation, snapshot, SyncError } from '@/src/lib/sync-server';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
async function respond(
  request: Request,
  work: (userId: string) => Promise<unknown>,
) {
  try {
    const user = await isAuthenticated();
    if (!user || request.headers.get('X-Maitu-Account') !== user._id)
      return Response.json(
        { error: 'Sign in to sync.' },
        { status: 401, headers },
      );
    return Response.json(await work(user._id), { headers });
  } catch (error) {
    if (error instanceof SyncError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    logger.error({ err: error }, 'Sync failed');
    return Response.json(
      { error: 'Sync is temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
export async function GET(request: Request) {
  return respond(request, async (userId) =>
    snapshot(await getMongoDb(), userId),
  );
}
export async function POST(request: Request) {
  // Same-origin credentials are required; do not let another site enqueue mutations.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json(
      { error: 'Invalid origin.' },
      { status: 403, headers },
    );
  return respond(request, async (userId) => {
    const text = await request.text();
    if (text.length > 100000)
      throw new SyncError('Operation is too large.', 413);
    let operation;
    try {
      operation = JSON.parse(text);
    } catch {
      throw new SyncError('Invalid JSON.');
    }
    return applyOperation(await getMongoDb(), userId, operation);
  });
}
