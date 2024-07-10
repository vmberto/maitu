'use client';

import BarsIcon from '@heroicons/react/16/solid/Bars4Icon';

import { Typography } from '@/src/components/Typography';
import { logout } from '@/src/lib/auth/auth';

export const MaituHeader = () => (
  <header className="bg-gray-100">
    <div className="mx-auto my-0 flex max-w-2xl flex-row items-center px-6 py-3 ">
      <Typography as="h1" className="text-xl font-semibold text-primary">
        maitu
      </Typography>
      <button
        type="button"
        className="ml-auto rounded-full px-3 py-0.5 text-base
        text-primary transition hover:bg-gray-200"
        onClick={() => logout()}
      >
        <BarsIcon aria-label="bars" className="size-6" />
      </button>
    </div>
  </header>
);
