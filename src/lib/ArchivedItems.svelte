<script lang="ts">
  import Disclosure from './ui/Disclosure.svelte';
  import Icon from './ui/Icon.svelte';
  import type { Task } from '../../types/main';
  let { items, openItem, notesOnly = false, collapsible = true }: { items: Task[]; openItem: (id: string) => void; notesOnly?: boolean; collapsible?: boolean } = $props();
</script>

{#snippet rows()}
  {#each items as item (String(item._id))}
    <button class="flex w-full items-start gap-3 py-3 text-left" aria-label={`Open archived ${item.type === 'note' || (notesOnly && !item.parentTaskId) ? 'note' : 'task'} ${item.title}`} onclick={() => openItem(String(item._id))}>
      <Icon name={item.type === 'note' || (notesOnly && !item.parentTaskId) ? 'note' : 'archive'} size={24} />
      <span class="min-w-0 break-words">{item.title}</span>
    </button>
  {:else}<p class="py-3 text-sm">No archived items.</p>{/each}
{/snippet}

{#if collapsible}<Disclosure title="Archived Items" badge={items.length} class="mt-6 text-gray-500">{@render rows()}</Disclosure>
{:else}<div class="text-gray-500">{@render rows()}</div>{/if}
