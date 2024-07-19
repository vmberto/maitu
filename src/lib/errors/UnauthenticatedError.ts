import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export class UnauthenticatedError extends Error {
  constructor() {
    super('UnauthenticatedError');
    redirect('/login');
  }
}
