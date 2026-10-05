import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from './logger';

const { SECRET_KEY } = process.env;
const key = new TextEncoder().encode(SECRET_KEY);

export const publicUser = (user: any) => ({
  _id: user._id.toString(),
  username: user.username,
  email: user.email,
});

export async function encrypt(payload: any) {
  if (!SECRET_KEY || key.byteLength < 32)
    throw new Error('SECRET_KEY must contain at least 32 bytes');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  if (!SECRET_KEY || key.byteLength < 32) return null;
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    logger.debug('Session decrypted successfully');
    return payload;
  } catch (err) {
    logger.warn({ err }, 'Failed to decrypt session');
    return null;
  }
}

export async function isAuthenticated() {
  const session = (await cookies()).get('session')?.value;
  if (session) {
    const decryptedSession = await decrypt(session);
    if (decryptedSession?.user?._id) {
      logger.debug(
        { userId: decryptedSession.user?._id },
        'User is authenticated',
      );
      return publicUser(decryptedSession.user);
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
