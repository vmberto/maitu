'use client';

import Image from 'next/image';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { clearActiveAccount, change } from '@/src/lib/offline/storage';

import { login } from '@/src/actions/auth.action';
import { Button } from '@/src/components/Button/Button';
import { Input } from '@/src/components/Input/Input';
import { Typography } from '@/src/components/Typography/Typography';

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      await clearActiveAccount();
      await change<boolean>('signedOut', () => false);
      const result = await login(null, formData);
      if (result?.formError) setError(result.formError);
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT'))
        throw err;
      setError('Could not sign in. Connect to the internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Maitu logo"
            width={60}
            height={60}
            className="mb-2"
          />
          <Typography as="h1" className="text-2xl font-bold text-primary">
            maitu
          </Typography>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="email" type="email" placeholder="Email" required />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <Button
            type="submit"
            label="Login"
            color="primary"
            loading={loading}
            className="mt-2 w-full rounded-md py-2 font-semibold"
          />
        </form>
      </div>
    </main>
  );
};
