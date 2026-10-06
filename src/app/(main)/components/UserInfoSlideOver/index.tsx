'use client';

import BarsIcon from '@heroicons/react/16/solid/Bars4Icon';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';

import { useOffline } from '@/src/components/Offline/OfflineProvider';
import { AppLink } from '@/src/components/Offline/AppLink';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import type { UserObject } from '@/types/main';

type Props = {
  user: UserObject;
};

export function UserInfoSlideOver({ user }: Props) {
  const [open, setOpen] = useState(false);
  const { signOut } = useOffline();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleConfirmLogout = async () => {
    setOpen(false);
    await signOut().catch(console.error);
  };

  return (
    <>
      <button
        type="button"
        aria-label="user-settings-menu"
        className="rubber-button rubber-icon ml-auto shrink-0 rounded-full p-2 text-primary transition hover:bg-gray-200"
        onClick={handleOpen}
      >
        <BarsIcon aria-hidden="true" className="size-6" />
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
            <ThemeToggle />
            <AppLink
              href="/archived"
              onClick={() => setOpen(false)}
              className="rubber-button flex w-full items-center justify-center gap-2 px-4 py-2 text-gray-700"
            >
              <ArchiveBoxIcon className="size-5" />
              Archived Lists
            </AppLink>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="rubber-button flex w-full items-center justify-center space-x-2 rounded-md border border-gray-300 bg-surface px-4 py-2
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
