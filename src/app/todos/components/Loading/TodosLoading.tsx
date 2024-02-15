import React from 'react';

export default function TodosLoading() {
  return (
    <main className="mx-auto my-0 h-full max-w-xl animate-pulse">
      <div className="mb-28 px-5 pb-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((skeleton) => (
          <div key={skeleton} className="flex  items-center border-t-2">
            <div
              className="relative mr-2
        items-center rounded-full border-2 border-transparent
          bg-gray-300 p-3.5 font-semibold transition-all"
            />
            <div
              className="relative z-10 my-4 block w-full
                    overflow-hidden rounded bg-gray-300 px-2 py-3 text-base outline-0 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
