'use server';

import * as bcrypt from 'bcrypt';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getMongoDb } from '@/src/lib/mongodb';

const secretKey = 'secret';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

// Decrypt function
export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function login(_: any, formData: FormData) {
  const db = await getMongoDb();
  const { email, password } = Object.fromEntries(formData.entries());

  const user = await db.collection('users').findOne({ email });

  if (!user || !user.password) {
    return {
      formError: 'Incorrect email or password',
    };
  }

  const validPassword = await bcrypt.compare(
    password.toString(),
    user.password,
  );

  if (!validPassword) {
    return {
      formError: 'Incorrect email or password',
    };
  }

  const expires = new Date(Date.now() + 60 * 60 * 24 * 7);
  const session = await encrypt({ user, expires });

  cookies().set('session', session, { expires, httpOnly: true });
  return redirect('/lists');
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return redirect('/');
  return decrypt(session);
}

export async function validateSession() {
  const session = cookies().get('session')?.value;
  return !!session;
}
