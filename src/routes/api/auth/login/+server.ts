import { json } from '@sveltejs/kit';
import { compare } from 'bcrypt';
import { getMongoDb } from '../../../../lib/mongodb';
import { encrypt, publicUser } from '../../../../lib/auth';
import { headers } from '#lib/session.server';
export async function POST({
  request,
  cookies,
  url,
}: import('./$types').RequestEvent) {
  if (request.headers.get('origin') !== url.origin)
    return json({ error: 'Invalid origin.' }, { status: 403, headers });
  try {
    const data = await request.formData();
    const email = data.get('email'),
      password = data.get('password');
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.length > 320 ||
      password.length > 1000
    )
      return json(
        { error: 'Incorrect email or password' },
        { status: 400, headers },
      );
    const user = await (
      await getMongoDb()
    )
      .collection('users')
      .findOne({ email });
    if (!user?.password || !(await compare(password, user.password)))
      return json(
        { error: 'Incorrect email or password' },
        { status: 401, headers },
      );
    const expires = new Date(Date.now() + 30 * 86400000);
    cookies.set(
      'session',
      await encrypt({ user: publicUser(user), expires: expires.toISOString() }),
      {
        path: '/',
        expires,
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'lax',
      },
    );
    return json({ user: publicUser(user) }, { headers });
  } catch {
    return json(
      { error: 'Sign in is temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
