<script lang="ts">
  import { onDestroy } from 'svelte';
  import { autosize } from './autosize';
  import { normalizeLocation } from './location';
  import type { TaskLocation } from '../../types/main';
  let { onadd }: { onadd: (place: TaskLocation, source: string) => Promise<boolean> } = $props();
  let input = $state('');
  let results = $state<TaskLocation[]>([]);
  let busy = $state(false);
  let adding = $state(false);
  let error = $state('');
  let message = $state('');
  let success = $state('');
  let sources = $state<{url: string; title: string}[]>([]);
  let controller: AbortController | undefined;
  let field: HTMLTextAreaElement;
  onDestroy(() => controller?.abort());

  function edited() {
    controller?.abort();
    busy = false;
    results = [];
    sources = [];
    message = '';
    success = '';
    error = '';
  }
  export function include(value: string) {
    edited();
    input = value;
    field?.focus();
    void find();
  }
  async function find(event?: SubmitEvent) {
    event?.preventDefault();
    if (!input.trim() || adding) return;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    const source = input.trim();
    busy = true;
    results = [];
    sources = [];
    message = '';
    success = '';
    error = '';
    try {
      const response = await fetch('/api/places', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: source }), signal: AbortSignal.any([active.signal, AbortSignal.timeout(50000)]),
      });
      const body = await response.json();
      if (active.signal.aborted || input.trim() !== source) return;
      if (!response.ok) throw new Error(body?.error || 'Could not find this place.');
      results = (body.places ?? []).map(normalizeLocation).filter((place: TaskLocation | null): place is TaskLocation => !!place);
      sources = Array.isArray(body.sources) ? body.sources.filter((source: {url?: unknown; title?: unknown}) => typeof source.url === 'string' && /^https?:\/\//i.test(source.url) && typeof source.title === 'string') : [];
      message = typeof body.message === 'string' ? body.message : '';
      if (body.autoAdd === true && results.length === 1) await add(results[0]);
      else if (!results.length) error = message || 'No matching places found. Add the city or paste a street address or coordinates.';
    } catch (cause) {
      if (!active.signal.aborted) error = cause instanceof Error && cause.name !== 'TimeoutError' ? cause.message : 'This search took too long. Try the place name and city.';
    } finally {
      if (controller === active) busy = false;
    }
  }
  async function add(place: TaskLocation) {
    if (adding) return;
    adding = true;
    try {
      if (await onadd(normalizeLocation(place)!, input)) {
        input = '';
        results = [];
        error = '';
        message = '';
        success = `Added ${place.name}`;
      } else error = 'Could not save this place on your device. Try again.';
    } finally { adding = false; }
  }
</script>

<section aria-label="Smart Place inclusion" class="my-4 rounded-xl bg-panel p-3">
  <h2 class="mb-2 text-sm font-semibold">Smart Place inclusion</h2>
  <form onsubmit={find} class="space-y-2">
    <textarea bind:this={field} bind:value={input} use:autosize={input} aria-label="Place info" maxlength="4096" rows="2" disabled={adding}
      placeholder="Paste a place name, address, shared text, Instagram post or website…"
      class="w-full resize-none rounded-lg border-0 bg-surface p-3 text-sm"
      oninput={edited}
      onpaste={(event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text?.trim()) { event.preventDefault(); include((input.slice(0, field.selectionStart) + text + input.slice(field.selectionEnd)).slice(0, 4096)); }
      }}
      onkeydown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); void find(); } }}
    ></textarea>
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-gray-500">Paste a link. Clear, verified matches are added automatically.</p>
      <button type="submit" disabled={!input.trim() || busy || adding} class="rubber-button shrink-0 text-sm text-primary">{busy ? 'Finding place…' : 'Find place'}</button>
    </div>
  </form>
  {#if busy}<p role="status" class="mt-3 text-sm text-gray-500">Reading the link and searching for the exact place…</p>{/if}
  {#if success}<p role="status" class="mt-3 text-sm text-primary">{success}</p>{/if}
  {#if error}<p role="alert" class="mt-3 text-sm text-danger">{error}</p>{/if}
  {#if results.length}<div aria-label="Places to add" class="mt-3 overflow-hidden rounded-lg bg-surface">
    <p class="px-3 pt-3 text-xs text-gray-500">{message || 'Choose a place to add'}</p>
    {#each results as place (`${place.source}:${place.placeId}:${place.latitude}:${place.longitude}`)}<button type="button" disabled={adding} aria-label={`Add ${place.name}`} class="rubber-button block w-full border-b border-gray-200 px-3 py-3 text-left last:border-0" onclick={() => void add(place)}>
      <span class="block text-sm font-semibold">{place.name}</span>
      <span class="block text-xs text-gray-500">{place.address || `${place.latitude}, ${place.longitude}`}</span>
    </button>{/each}
  </div>{/if}
  {#if sources.length}<div aria-label="Place sources" class="mt-2 flex flex-wrap gap-2 text-xs">
    {#each sources as source (source.url)}<a href={source.url} target="_blank" rel="noopener noreferrer" class="text-primary underline">{source.title}</a>{/each}
  </div>{/if}
</section>
