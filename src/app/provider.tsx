'use client';

import type { DropResult } from '@hello-pangea/dnd';

import { useOffline } from '@/src/components/Offline/OfflineProvider';
import type { List } from '@/types/main';

export type ListsState = {
  lists: List[];
  updateListsOrder: (result: DropResult) => Promise<void>;
  handleAddList: (newList: List) => Promise<void>;
  handleUpdateList: (id: string, data: Partial<List>) => Promise<void>;
  handleDeleteList: (id: string) => Promise<void>;
};

export function useLists(): ListsState {
  const { account, add, update, remove, commit } = useOffline();
  const lists = (
    account?.lists.filter(
      (list) => !list.deleted && !(list as List).archived,
    ) ?? []
  ).sort((a, b) => (a as List).index - (b as List).index) as List[];
  return {
    lists,
    handleAddList: async (data) => {
      await add('lists', { ...data, index: lists.length });
    },
    handleUpdateList: async (id, data) => {
      await update('lists', id, data);
    },
    handleDeleteList: async (id) => {
      await remove('lists', id);
    },
    updateListsOrder: async ({ source, destination }) => {
      if (!destination || source.index === destination.index) return;
      const movedId = lists[source.index]?._id;
      const targetId = lists[destination.index]?._id;
      await commit((saved) => {
        const ordered = saved.lists
          .filter((list) => !list.deleted && !(list as List).archived)
          .sort((a, b) => (a as List).index - (b as List).index);
        const from = ordered.findIndex((list) => list._id === movedId);
        const to = ordered.findIndex((list) => list._id === targetId);
        if (from < 0 || to < 0) return [];
        const [moved] = ordered.splice(from, 1);
        ordered.splice(to, 0, moved);
        return ordered.flatMap((list, index) =>
          (list as List).index === index
            ? []
            : [
                {
                  kind: 'lists' as const,
                  entityId: list._id,
                  action: 'patch' as const,
                  data: { index },
                },
              ],
        );
      });
    },
  };
}
