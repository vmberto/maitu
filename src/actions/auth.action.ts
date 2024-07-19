'use server';

import { compare } from 'bcrypt';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getMongoDb } from '@/src/lib/mongodb';

const { SECRET_KEY } = process.env;
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

// Decrypt function
export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
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

  const validPassword = await compare(password.toString(), user.password);

  if (!validPassword) {
    return {
      formError: 'Incorrect email or password',
    };
  }

  const expires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString();
  const session = await encrypt({ user, expires });

  cookies().set('session', session, {
    expires: new Date(expires),
    httpOnly: true,
  });
  return redirect('/');
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
}

export async function isAuthenticated() {
  const session = cookies().get('session')?.value;
  if (session) {
    const decryptedSession = await decrypt(session);
    return decryptedSession ? decryptedSession.user : null;
  }
  return null;
}

export async function getSession() {
  const user = await isAuthenticated();
  if (user) {
    return user;
  }
  return redirect('/login');
}
