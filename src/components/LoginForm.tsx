'use client';

import { useFormState } from 'react-dom';

import { login } from '@/src/lib/auth/auth';

export default function LoginForm() {
  const [state, formAction] = useFormState(login, null);

  return (
    <div className="grid h-screen place-items-center">
      <div className="rounded-lg border-t-4 border-green-400 p-5 shadow-lg">
        <h1 className="my-4 text-xl font-bold">Login</h1>

        <form action={formAction} className="flex flex-col gap-3">
          <input name="email" type="text" placeholder="Email" />
          <input name="password" type="password" placeholder="Password" />
          <button
            type="submit"
            className="cursor-pointer bg-green-600 px-6 py-2 font-bold text-white"
          >
            Login
          </button>
        </form>
        <p>{state && state.formError ? state.formError : ''}</p>
      </div>
    </div>
  );
}
