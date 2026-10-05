'use client';

import { MoonIcon } from '@heroicons/react/24/solid';
import { useSyncExternalStore } from 'react';
import { setTheme } from '@/src/lib/theme';

function subscribe(notify: () => void) {
  window.addEventListener('maitu-theme-change', notify);
  return () => window.removeEventListener('maitu-theme-change', notify);
}
export function useDarkMode() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
}
export function ThemeToggle() {
  const dark = useDarkMode();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark Mode"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200"
    >
      <MoonIcon className="size-5" />
      <span>Dark Mode</span>
      <span className="ml-auto text-sm text-gray-600">
        {dark ? 'On' : 'Off'}
      </span>
    </button>
  );
}
