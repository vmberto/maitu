'use client';

import { useFormState } from 'react-dom';

import { login } from '@/src/actions/auth.action';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Typography } from '@/src/components/Typography';

export default function LoginForm() {
  const [state, formAction] = useFormState(login, null);

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

        <form action={formAction} className="flex flex-col gap-4">
          <Input name="email" type="text" placeholder="Email" />
          <Input name="password" type="password" placeholder="Password" />
          <Button
            type="submit"
            label="Login"
            color="primary"
            className="cursor-pointer px-6 py-2 font-bold text-white"
          />
        </form>
        <p>{state && state.formError ? state.formError : ''}</p>
      </div>
    </main>
  );
}
