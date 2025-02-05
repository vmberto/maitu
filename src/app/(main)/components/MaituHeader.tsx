'use client';

import BarsIcon from '@heroicons/react/16/solid/Bars4Icon';
import { useState } from 'react';

import { UserInfoSlideOver } from '@/src/app/(main)/components/UserInfoSlideOver';
import { Typography } from '@/src/components/Typography/Typography';

export const MaituHeader = () => {
  const [open, setOpen] = useState<boolean>(false);

  const handleLogout = () => {
    setOpen(true); // Open the SlideOver instead of logging out immediately
  };

  return (
    <header className="bg-gray-100">
      <div className="mx-auto my-0 flex max-w-2xl flex-row items-center px-6 py-3 ">
        <Typography as="h1" className="text-xl font-semibold text-primary">
          maitu
        </Typography>
        <button
          type="button"
          className="ml-auto rounded-full px-3 py-0.5 text-base
          text-primary transition hover:bg-gray-200"
          onClick={handleLogout} // Open SlideOver
        >
          <BarsIcon aria-label="bars" className="size-6" />
        </button>
      </div>

      <UserInfoSlideOver open={open} setOpen={setOpen} />
    </header>
  );
};
