import { decrypt, publicUser } from './auth';
import type { Cookies } from '@sveltejs/kit';
export async function session(cookies: Cookies) {
  const token = cookies.get('session');
  const value = token ? await decrypt(token) : null;
  return value?.user?._id ? publicUser(value.user) : null;
}
export const headers = { 'Cache-Control': 'private, no-store' };
