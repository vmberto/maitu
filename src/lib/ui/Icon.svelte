<script lang="ts">
  let {
    name,
    size = 20,
  }: {
    name:
      'map' | 'menu' | 'back' | 'dots' | 'clone' | 'trash' | 'chevron' | 'plus' | 'note' | 'archive' | 'close';
    size?: number;
  } = $props();
</script>

<svg
  style="flex-shrink: 0"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'map'}<path
      d="m9 4-6 3v14l6-3 6 3 6-3V4l-6 3-6-3Zm0 0v14m6-11v14"
    />
  {:else if name === 'menu'}<path d="M4 6h16M4 12h16M4 18h16" />
  {:else if name === 'back'}<path d="m10 5-7 7 7 7M3 12h18" />
  {:else if name === 'clone'}<rect
      x="8"
      y="8"
      width="12"
      height="12"
      rx="2"
    /><path d="M16 8V4H4v12h4" />
  {:else if name === 'trash'}<path
      d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7"
    />
  {:else if name === 'chevron'}<path d="m6 9 6 6 6-6" />
  {:else if name === 'archive'}<rect x="3" y="3" width="18" height="5" rx="1" /><path d="M5 8v13h14V8M10 12h4" />
  {:else if name === 'note'}<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h8" />
  {:else if name === 'close'}<path d="m6 6 12 12M6 18 18 6" />
  {:else if name === 'plus'}<path d="M12 5v14M5 12h14" />
  {:else}<circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle
      cx="19"
      cy="12"
      r="1"
    />{/if}
</svg>
