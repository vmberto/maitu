'use client';

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
    <main
      className="grid h-screen place-items-center rounded-md border-2 border-gray-200 align-middle
      shadow-sm shadow-gray-400"
    >
      <div className="mx-8 rounded-lg border-8 border-gray-100 bg-gray-100 p-5 shadow-lg">
        <Typography
          as="h1"
          className="mb-4 text-center text-xl font-bold text-primary"
        >
          maitu
        </Typography>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="email" type="text" placeholder="Email" />
          <Input name="password" type="password" placeholder="Password" />
          <Button
            type="submit"
            label="Login"
            color="primary"
            loading={loading}
            className="cursor-pointer px-6 py-2 font-bold text-white"
          />
        </form>
      </div>
    </main>
  );
};
