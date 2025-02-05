'use client';

import { logout } from '@/src/actions/auth.action';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function UserInfoSlideOver({ open, setOpen }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <SlideOver
      title="User Info"
      open={open}
      onClose={handleClose}
      direction="right"
    >
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={handleConfirmLogout}
          className="w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </SlideOver>
  );
}
