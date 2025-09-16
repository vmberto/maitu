'use client';

import Image from 'next/image';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { login } from '@/src/actions/auth.action';
import { Button } from '@/src/components/Button/Button';
import { Input } from '@/src/components/Input/Input';
import { Typography } from '@/src/components/Typography/Typography';

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    await login(null, formData);

    setLoading(false);
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
