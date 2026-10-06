'use client';
import { AppHeader } from '@/src/components/AppHeader';
import { AppLink } from './AppLink';
import { useOffline } from './OfflineProvider';
import { ListType, type List } from '@/types/main';
export function ArchivedListsScreen() {
  const { account } = useOffline();
  const lists = (account?.lists ?? []).filter(
    (list) => !list.deleted && (list as List).archived,
  ) as List[];
  return (
    <>
      <AppHeader title="Archived Lists" />
      <main className="mx-auto max-w-xl space-y-2 px-5 py-4">
        <p className="mb-4 text-sm text-gray-500">
          Archived lists are read only.
        </p>
        {lists.map((list) => (
          <AppLink
            key={list._id}
            href={`${list.type === ListType.timeline ? '/timeline' : '/tasks'}?listId=${encodeURIComponent(String(list._id))}`}
            className="flex items-center gap-3 rounded-lg bg-panel px-4 py-3 font-medium"
          >
            <span className="text-2xl">{list.emoji}</span>
            {list.title}
          </AppLink>
        ))}
        {!lists.length && (
          <p className="py-6 text-gray-500">No archived lists yet.</p>
        )}
      </main>
    </>
  );
}
