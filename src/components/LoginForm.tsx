'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import type { GenericEvent } from '@/types/events';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: GenericEvent) => {
    e.preventDefault();

    try {
      const response = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        setError('Invalid Credentials');
        return;
      }

      router.replace('/lists');
    } catch {
      /* empty */
    }
  };

  return (
    <div className="grid h-screen place-items-center">
      <div className="rounded-lg border-t-4 border-green-400 p-5 shadow-lg">
        <h1 className="my-4 text-xl font-bold">Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Email"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button
            type="submit"
            className="cursor-pointer bg-green-600 px-6 py-2 font-bold text-white"
          >
            Login
          </button>
          {error && (
            <div className="mt-2 w-fit rounded-md bg-red-500 px-3 py-1 text-sm text-white">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
