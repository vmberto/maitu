'use server';

import { compare } from 'bcrypt';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { logger } from '@/src/lib/logger';
import { getMongoDb } from '@/src/lib/mongodb';

const { SECRET_KEY } = process.env;
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
  logger.debug({ payload }, 'Encrypting session payload');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    logger.debug('Session decrypted successfully');
    return payload;
  } catch (err) {
    logger.warn({ err }, 'Failed to decrypt session');
    return null;
  }
}

export async function login(_: any, formData: FormData) {
  const db = await getMongoDb();
  const { email, password } = Object.fromEntries(formData.entries());

  const user = await db.collection('users').findOne({ email });

  if (!user || !user.password) {
    logger.warn({ email }, 'Login failed: user not found or missing password');
    return { formError: 'Incorrect email or password' };
  }

  const validPassword = await compare(password.toString(), user.password);

  if (!validPassword) {
    logger.warn({ email }, 'Login failed: invalid password');
    return { formError: 'Incorrect email or password' };
  }

  const expires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString();
  const session = await encrypt({ user, expires });

  cookies().set('session', session, {
    expires: new Date(expires),
    httpOnly: true,
  });

  logger.info({ userId: user._id, email }, 'User logged in successfully');
  return redirect('/');
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
  logger.info('User logged out');
}

export async function isAuthenticated() {
  const session = cookies().get('session')?.value;
  if (session) {
    const decryptedSession = await decrypt(session);
    if (decryptedSession) {
      logger.debug(
        { userId: decryptedSession.user?._id },
        'User is authenticated',
      );
      return decryptedSession.user;
    }
    logger.warn('Session invalid or expired');
    return null;
  }
  logger.debug('No session cookie found');
  return null;
}

export async function getSession() {
  const user = await isAuthenticated();
  if (user) {
    logger.debug({ userId: user._id }, 'Session resolved successfully');
    return user;
  }
  logger.warn('No valid session, redirecting to login');
  return redirect('/login');
}
