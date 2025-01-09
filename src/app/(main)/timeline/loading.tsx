import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React from 'react';

export default function Loading() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-gray-100 bg-white align-middle">
        <div className="animate-pulse">
          <div className="mx-auto flex h-full max-w-xl items-center">
            <div className="flex h-12 pl-5">
              <ArrowLeftIcon
                className="relative mr-3 size-5 self-center"
                color="#BDBDBD"
              />
            </div>
            <div
              className="w-1/3 overflow-hidden rounded
                    bg-gray-300 px-2 py-3 pr-5"
            />
          </div>
        </div>
      </header>
      <section className="mx-auto h-full max-w-xl items-center">
        <div className="mb-28 px-5 pb-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((skeleton) => (
            <div key={skeleton} className="flex  items-center border-b-2">
              <div
                className="relative mr-2
        items-center rounded-full border-2 border-transparent
          bg-gray-300 p-3.5 font-semibold transition-all"
              />
              <div
                className="relative z-10 my-4 block w-full
                    overflow-hidden rounded bg-gray-300 px-2 py-3
                    text-base outline-0 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
