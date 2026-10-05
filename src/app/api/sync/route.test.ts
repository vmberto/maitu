/** @jest-environment node */
import { GET, POST } from './route';
import { isAuthenticated } from '@/src/lib/session';
import { getMongoDb } from '@/src/lib/mongodb';
import { applyOperation, snapshot } from '@/src/lib/sync-server';

jest.mock('@/src/lib/session', () => ({ isAuthenticated: jest.fn() }));
jest.mock('@/src/lib/mongodb', () => ({ getMongoDb: jest.fn() }));
jest.mock('@/src/lib/sync-server', () => ({
  ...jest.requireActual('@/src/lib/sync-server'),
  applyOperation: jest.fn(),
  snapshot: jest.fn(),
}));
jest.mock('@/src/lib/logger', () => ({ logger: { error: jest.fn() } }));
const userId = '507f191e810c19729de860ea';
function request(
  method = 'GET',
  body?: string,
  origin = 'https://maitu.example',
  account = userId,
) {
  return new Request('https://maitu.example/api/sync', {
    method,
    headers: { Origin: origin, 'X-Maitu-Account': account },
    body,
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  (isAuthenticated as jest.Mock).mockResolvedValue({ _id: userId });
  (getMongoDb as jest.Mock).mockResolvedValue({});
  (snapshot as jest.Mock).mockResolvedValue({ lists: [], tasks: [] });
});
it('requires authentication and never caches personal data', async () => {
  (isAuthenticated as jest.Mock).mockResolvedValue(null);
  const response = await GET(request());
  expect(response.status).toBe(401);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(snapshot).not.toHaveBeenCalled();
});
it('rejects a queue whose account differs from the current cookie', async () => {
  expect(
    (await POST(request('POST', '{}', undefined, 'another-account'))).status,
  ).toBe(401);
  expect(applyOperation).not.toHaveBeenCalled();
});
it('rejects cross-origin mutations', async () => {
  expect(
    (await POST(request('POST', '{}', 'https://another.example'))).status,
  ).toBe(403);
  expect(applyOperation).not.toHaveBeenCalled();
});
it('returns a recoverable validation error for malformed or oversized operations', async () => {
  expect((await POST(request('POST', '{bad'))).status).toBe(400);
  expect((await POST(request('POST', 'x'.repeat(100001)))).status).toBe(413);
});
it('returns a retryable response when MongoDB is unavailable', async () => {
  (getMongoDb as jest.Mock).mockRejectedValue(
    new Error('Database unavailable'),
  );
  expect((await GET(request())).status).toBe(503);
});
