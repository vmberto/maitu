'use server';

import { Scrypt } from 'lucia';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getLucia } from '@/src/lib/auth/auth';
import { getMongoDb } from '@/src/lib/mongodb';

export async function login(
  _: any,
  formData: FormData,
  // ): Promise<ActionResponse<LoginInput>> {
): Promise<any> {
  const db = await getMongoDb();
  const { email, password } = Object.fromEntries(formData.entries());

  const existingUser = await db
    .collection('users')
    .findOne({ email: email.toString() });

  if (!existingUser || !existingUser.password) {
    return {
      formError: 'Incorrect email or password',
    };
  }

  // 59e0486476e2af66b52ada3a48fa3e2c:3cda2ec390cd973037863310bfa962a072f51f5babc37dffd4b36627a3bbf134a8d966c288bde8559c33260df2736164f25f0892866b71b137c0cc949c62c544
  existingUser.password =
    '59e0486476e2af66b52ada3a48fa3e2c:3cda2ec390cd973037863310bfa962a072f51f5babc37dffd4b36627a3bbf134a8d966c288bde8559c33260df2736164f25f0892866b71b137c0cc949c62c544';

  const lucia = await getLucia();

  const validPassword = await new Scrypt().verify(
    existingUser.password,
    password.toString(),
  );

  if (!validPassword) {
    return {
      formError: 'Incorrect email or password',
    };
  }

  const session = await lucia.createSession(existingUser._id.toString(), {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect('/lists');
}
