'use server';

import { compare } from 'bcrypt';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { encrypt, publicUser } from '@/src/lib/session';

import { logger } from '@/src/lib/logger';
import { getMongoDb } from '@/src/lib/mongodb';

export async function login(_: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.length > 320 ||
    password.length > 1000
  )
    return { formError: 'Incorrect email or password' };
  const db = await getMongoDb();

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
  const session = await encrypt({ user: publicUser(user), expires });

  (await cookies()).set('session', session, {
    expires: new Date(expires),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  logger.info({ userId: user._id, email }, 'User logged in successfully');
  return redirect('/');
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
  logger.info('User logged out');
}
