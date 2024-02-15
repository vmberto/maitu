import { signOut } from 'next-auth/react';

import { Typography } from '@/src/components/Typography';

export const MaituHeader = () => (
  <header className="bg-gray-100">
    <div className="mx-auto my-0 flex max-w-2xl flex-row items-center px-6 py-3 ">
      <Typography as="h1" className="text-xl font-semibold text-primary">
        maitu
      </Typography>
      <button
        type="button"
        className="ml-auto rounded-full border-2 border-primary px-3 py-0.5 text-base text-primary transition hover:bg-primary hover:text-white"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Logout
      </button>
    </div>
  </header>
);
