import { jwtVerify, SignJWT } from 'jose';
import { env } from '$env/dynamic/private';
import { logger } from './logger';

const { SECRET_KEY } = env;
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
