import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React from 'react';

export default function HeaderLoading() {
  return (
    <main className="mx-auto my-0 h-full max-w-xl animate-pulse">
      <div className="flex items-center py-2">
        <div className="flex h-12 pl-5">
          <ArrowLeftIcon className="relative mr-3 w-6" color="#BDBDBD" />
        </div>
        <div
          className="w-1/3 overflow-hidden rounded
                    bg-gray-300 px-2 py-4 pr-5"
        />
      </div>
    </main>
  );
}
