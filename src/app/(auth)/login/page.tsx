import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/src/actions/auth.action';
import LoginForm from '@/src/components/LoginForm';

export default async function Home() {
  const sessionExists = await isAuthenticated();

  if (sessionExists) {
    redirect('/');
  }

  return <LoginForm />;
}
