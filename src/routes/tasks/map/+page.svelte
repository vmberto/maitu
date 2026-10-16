<script lang="ts">
  import { page } from '$app/state';
  import { offline } from '#lib/offline';
  import ListHeader from '#lib/ListHeader.svelte';
  import PlacesMap from '#lib/PlacesMap.svelte';
  import type { List } from '../../../../types/main';
  const list = $derived($offline.account?.lists.find((item) => !item.deleted && item._id === page.url.searchParams.get('listId')) as List | undefined);
</script>

<ListHeader {list} />
<PlacesMap />
