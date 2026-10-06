'use client';
import { usePathname } from 'next/navigation';
import { MapIcon } from '@heroicons/react/24/outline';
import { AppLink } from '@/src/components/Offline/AppLink';
import type { CSSProperties } from 'react';
import { HexColors } from '@/src/lib/colors';
import { normalizeLocation } from '@/src/lib/location';
import type { List, Task } from '@/types/main';
export function TaskMapButton({ tasks, list }: { tasks: Task[]; list: List }) {
  const onMap = usePathname() === '/tasks/map';
  if (!onMap && !tasks.some((task) => normalizeLocation(task.location)))
    return null;
  return (
    <AppLink
      aria-current={onMap ? 'page' : undefined}
      title={onMap ? 'Show tasks' : 'Show map'}
      href={`${onMap ? '/tasks' : '/tasks/map'}?listId=${encodeURIComponent(String(list._id))}`}
      aria-label="Map"
      style={
        {
          color: HexColors.get(list.color) ?? '#3664ff',
          '--rubber-accent': HexColors.get(list.color) ?? '#3664ff',
        } as CSSProperties
      }
      className={`rubber-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary hover:bg-gray-200 ${onMap ? 'bg-gray-200' : ''}`}
    >
      <MapIcon className="size-5" /> Map
    </AppLink>
  );
}
