'use client';

import BarsIcon from '@heroicons/react/16/solid/Bars4Icon';
import {
  ArrowRightOnRectangleIcon,
  MoonIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';

import { logout } from '@/src/actions/auth.action';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import type { UserObject } from '@/types/main';

type Props = {
  user: UserObject;
};

export function UserInfoSlideOver({ user }: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleConfirmLogout = async () => {
    setOpen(false);
    await logout().catch(console.error);
  };

  return (
    <>
      <button
        type="button"
        className="ml-auto rounded-full p-2 text-primary transition hover:bg-gray-200"
        onClick={handleOpen}
      >
        <BarsIcon aria-label="menu" className="size-6" />
      </button>

      <SlideOver open={open} onClose={handleClose} direction="right">
        <div className="flex flex-col items-center space-y-6 p-6">
          <div className="flex flex-col items-center space-y-2">
            <UserCircleIcon className="size-16 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900">
              {user.username}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="w-full space-y-3">
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center space-x-2 rounded-md border border-gray-200
                         bg-gray-100 px-4 py-2 text-gray-400"
            >
              <MoonIcon className="size-5" />
              <span>Dark Mode</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="flex w-full items-center justify-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2
                         text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="size-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}
