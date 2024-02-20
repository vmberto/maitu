import React from 'react';

export default function ListsLoading() {
  return (
    <main className="mx-auto my-0 h-full max-w-xl animate-pulse">
      <div className="mx-auto mb-60 mt-0 max-w-xl p-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((skeleton) => (
          <div key={skeleton} className="mb-2 flex items-center">
            <div
              className="flex h-20 w-full animate-pulse items-center
          justify-center gap-2 rounded-md border-2 border-gray-100
          bg-gray-300 p-4 align-middle font-semibold
           transition-all active:opacity-30"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
