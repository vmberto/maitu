import { redirect } from 'next/navigation';

import LoginForm from '@/src/components/LoginForm';
import { isAuthenticated } from '@/src/lib/auth';

export default async function Home() {
  const sessionExists = await isAuthenticated();

  if (sessionExists) {
    redirect('/lists');
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
