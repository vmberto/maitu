import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { nextAuthOptions } from '@/src/app/api/auth/[...nextauth]/auth-options';
import LoginForm from '@/src/components/LoginForm';

export default async function Home() {
  const authSession = await getServerSession(nextAuthOptions);

  if (authSession) {
    redirect('/lists');
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
