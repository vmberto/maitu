<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLDetailsAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';
  let { title, badge, children, class: className = '', ...attributes }: HTMLDetailsAttributes & { title: string; badge?: number; children: Snippet } = $props();
</script>

<details class={className} {...attributes}>
  <summary><span>{title}</span><span class="indicators">{#if badge !== undefined}<span class="badge">{badge}</span>{/if}<span class="chevron"><Icon name="chevron" size={18} /></span></span></summary>
  <div class="content">{@render children()}</div>
</details>

<style>
  details { padding: 16px; border: 1px solid rgb(var(--gray-200)); border-radius: 12px; background: rgb(var(--surface)); box-shadow: var(--ui-raised-shadow); interpolate-size: allow-keywords; }
  summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; list-style: none; font-weight: 600; }
  summary::-webkit-details-marker { display: none; }
  .indicators { display: flex; align-items: center; gap: 8px; }
  .badge { border-radius: 999px; background: rgb(var(--surface)); padding: 4px 8px; font-size: 12px; }
  .chevron { display: flex; transition: transform 180ms ease; }
  details[open] .chevron { transform: rotate(180deg); }
  .content { padding-top: 16px; }
  details::details-content { height: 0; opacity: 0; overflow: clip; transition: height 180ms ease, opacity 180ms ease, content-visibility 180ms allow-discrete; }
  details[open]::details-content { height: auto; opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .chevron, details::details-content { transition: none; } }
</style>
