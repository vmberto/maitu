import { redirect } from 'next/navigation';

import LoginForm from '@/src/components/LoginForm';
import { validateSession } from '@/src/lib/auth/auth';

export default async function Home() {
  const sessionExists = await validateSession();

  if (sessionExists) {
    redirect('/lists');
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
