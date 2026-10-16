<script lang="ts">
  let { options, value, onchange, label, appearance = 'segmented' }: {
    options: { value: string; label: string }[];
    value: string;
    onchange: (value: string) => void;
    label: string;
    appearance?: 'segmented' | 'underline';
  } = $props();
</script>

<div class="ui-tabs" class:underline-tabs={appearance === 'underline'} role="tablist" aria-label={label}>
  {#each options as option, index (option.value)}
    <button type="button" role="tab" aria-selected={value === option.value}
      tabindex={value === option.value ? 0 : -1}
      onclick={() => onchange(option.value)}
      onkeydown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
        onchange(options[next].value);
        (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
      }}>{option.label}</button>
  {/each}
</div>

<style>
  .ui-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 12px; background: rgb(var(--gray-100)); }
  button { flex: 1; padding: 5px 8px; border: 1px solid transparent; border-radius: 9px; font-size: 12px; font-weight: 500; transition: background-color 150ms ease, color 150ms ease; }
  button[aria-selected='true'] { border-color: rgb(var(--gray-200)); background: rgb(var(--surface)); color: #3664ff; box-shadow: var(--ui-selected-shadow); }
  button:focus-visible { outline: none; }
  .underline-tabs { gap: 16px; padding: 0; border-radius: 0; background: transparent; margin-bottom: -1px; }
  .underline-tabs button { flex: none; padding: 12px 10px; border-radius: 0; border-bottom: 2px solid transparent; font-size: 14px; color: var(--list-color, rgb(var(--gray-500))); }
  .underline-tabs button[aria-selected='true'] { background: transparent; border-color: transparent; border-bottom-color: var(--list-color, #3664ff); color: var(--list-color, #3664ff); box-shadow: none; }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
</style>
