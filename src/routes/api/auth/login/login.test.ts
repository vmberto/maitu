import { ObjectId } from 'mongodb';
import { hash } from 'bcrypt';
const findOne = vi.hoisted(() => vi.fn());
vi.mock('../../../../lib/mongodb', () => ({
  getMongoDb: async () => ({ collection: () => ({ findOne }) }),
}));
beforeAll(() => {
  process.env.SECRET_KEY = 'a-test-only-secret-with-at-least-32-bytes';
});
it('signs in with a verified password and scopes an HTTP-only session cookie; rejects untrusted requests', async () => {
  const { POST } = await import('./+server');
  const { decrypt } = await import('../../../../lib/auth');
  findOne.mockResolvedValue({
    _id: new ObjectId('507f191e810c19729de860ea'),
    email: 'test@example.com',
    username: 'Test',
    password: await hash('correct-password', 4),
  });
  const set = vi.fn();
  const form = new FormData();
  form.set('email', 'test@example.com');
  form.set('password', 'correct-password');
  const event = {
    url: new URL('https://maitu.example/api/auth/login'),
    cookies: { set },
    request: new Request('https://maitu.example/api/auth/login', {
      method: 'POST',
      headers: { Origin: 'https://maitu.example' },
      body: form,
    }),
  };
  expect((await POST(event as any)).status).toBe(200);
  const [name, token, options] = set.mock.calls[0];
  expect(name).toBe('session');
  expect(options).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
  const session = await decrypt(token);
  expect(session.user.email).toBe('test@example.com');
  expect(session.user.password).toBeUndefined();
  event.request = new Request(event.url, {
    method: 'POST',
    headers: { Origin: 'https://other.example' },
    body: form,
  });
  expect((await POST(event as any)).status).toBe(403);
  form.set('password', 'wrong-password');
  event.request = new Request(event.url, {
    method: 'POST',
    headers: { Origin: event.url.origin },
    body: form,
  });
  expect((await POST(event as any)).status).toBe(401);
  expect(set).toHaveBeenCalledTimes(1);
});
