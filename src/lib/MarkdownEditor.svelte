<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from '@tiptap/markdown';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  let { value, readonly = false, onchange }: { value: string; readonly?: boolean; onchange: (value: string) => void } = $props();
  let host: HTMLDivElement;
  let editor = $state.raw<Editor | null>(null);
  let empty = $state(true);
  let lastValue = '';
  function cleanHtml(content: string) {
    const safe = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
    const document = new DOMParser().parseFromString(safe, 'text/html');
    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href')!;
      if (!/^https?:\/\//i.test(href)) continue;
      let url: URL;
      try { url = new URL(href); } catch { continue; }
      if (link.textContent === href || /^(https?:\/\/|www\.)/i.test(link.textContent ?? ''))
        link.textContent = url.hostname.replace(/^www\./, '');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
    return document.body.innerHTML;
  }
  const html = (text: string) => cleanHtml(marked.parse(text, { async: false, breaks: true }));

  onMount(() => {
    lastValue = value;
    editor = new Editor({
      element: host,
      extensions: [StarterKit.configure({ underline: false, trailingNode: false, link: { openOnClick: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } } }), Markdown],
      enableInputRules: ['bold', 'bulletList'],
      content: html(value),
      editable: !readonly,
      editorProps: {
        attributes: { role: 'textbox', 'aria-label': 'Description', 'aria-multiline': 'true' },
        transformPastedHTML: cleanHtml,
        handlePaste: (_view, event) => {
          if (event.clipboardData?.getData('text/html')) return false;
          const text = event.clipboardData?.getData('text/plain');
          if (!text || readonly) return false;
          event.preventDefault();
          editor?.commands.insertContent(html(text));
          return true;
        },
      },
      onTransaction: ({ editor }) => {
        empty = editor.isEmpty;
      },
      onUpdate: ({ editor }) => {
        lastValue = editor.getMarkdown();
        onchange(lastValue);
      },
    });
    empty = editor.isEmpty;
    return () => editor?.destroy();
  });

  $effect(() => {
    if (!editor) return;
    editor.setEditable(!readonly, false);
    editor.view.dom.setAttribute('aria-readonly', String(readonly));
    if (value !== lastValue) {
      lastValue = value;
      editor.commands.setContent(html(value), { emitUpdate: false });
      empty = editor.isEmpty;
    }
  });
</script>

<div class="markdown-editor">
  <div bind:this={host} class="editor-host" class:empty data-placeholder="Write about it…"></div>
</div>

<style>
  .markdown-editor { min-height: 64px; color: rgb(var(--gray-900)); line-height: 1.65; overflow-wrap: anywhere; }
  .editor-host { position: relative; }
  .editor-host :global(.ProseMirror) { min-height: 72px; outline: none; }
  .editor-host.empty::before { position: absolute; top: 0; content: attr(data-placeholder); color: rgb(var(--gray-400)); pointer-events: none; }
  .markdown-editor :global(p) { margin: 0 0 12px; }
  .markdown-editor :global(h1), .markdown-editor :global(h2), .markdown-editor :global(h3), .markdown-editor :global(h4), .markdown-editor :global(h5), .markdown-editor :global(h6) { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 20px 0 12px; }
  .markdown-editor :global(.ProseMirror > :first-child) { margin-top: 0; }
  .markdown-editor :global(.ProseMirror > :last-child) { margin-bottom: 0; }
  .markdown-editor :global(ul) { list-style: disc; padding-left: 24px; margin: 12px 0; }
  .markdown-editor :global(ol) { list-style: decimal; padding-left: 24px; margin: 12px 0; }
  .markdown-editor :global(li p) { margin: 0; }
  .markdown-editor :global(a) { position: relative; display: inline-block; max-width: min(100%, 22ch); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; border-radius: 999px; padding: 1px 7px 1px 23px; background: rgb(54 100 255 / 9%); color: #3664ff; font-size: 12px; text-decoration: none; cursor: default; transition: background-color 150ms ease; }
  @media (hover: hover) {
    .markdown-editor :global(a:hover) { background: rgb(54 100 255 / 18%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .markdown-editor :global(a) { transition: none; }
  }
  .markdown-editor :global(a)::before { content: ''; position: absolute; left: 7px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: currentColor; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='2' stroke-linecap='round' d='m10 13 4-4M8 15l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 3 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0'/%3E%3C/svg%3E") center / contain no-repeat; }
  .markdown-editor :global(pre) { overflow-x: auto; border-radius: 8px; background: rgb(var(--surface)); padding: 12px; margin: 12px 0; }
  .markdown-editor :global(code) { font-size: 0.9em; }
  .markdown-editor :global(blockquote) { border-left: 3px solid rgb(var(--gray-300)); padding-left: 16px; margin: 12px 0; color: rgb(var(--gray-500)); }
  .markdown-editor :global(img) { max-width: 100%; height: auto; }
  .markdown-editor :global(table) { display: block; overflow-x: auto; border-collapse: collapse; max-width: 100%; }
  .markdown-editor :global(th), .markdown-editor :global(td) { border: 1px solid rgb(var(--gray-200)); padding: 6px 10px; }
  .markdown-editor :global(hr) { margin: 20px 0; border-top: 1px solid rgb(var(--gray-200)); }
</style>
