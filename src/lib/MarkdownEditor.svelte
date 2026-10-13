<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from '@tiptap/markdown';
  import Image from '@tiptap/extension-image';
  import { TableKit } from '@tiptap/extension-table';
  import { TaskList, TaskItem } from '@tiptap/extension-list';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  let { value, readonly = false, onchange }: { value: string; readonly?: boolean; onchange: (value: string) => void } = $props();
  let host: HTMLDivElement;
  let editor = $state.raw<Editor | null>(null);
  let empty = $state(true);
  let lastValue = '';
  const html = (text: string) => DOMPurify.sanitize(marked.parse(text, { async: false, breaks: true }), { USE_PROFILES: { html: true } });

  onMount(() => {
    lastValue = value;
    editor = new Editor({
      element: host,
      extensions: [StarterKit.configure({ underline: false, trailingNode: false, link: { openOnClick: false } }), Markdown, Image, TableKit, TaskList, TaskItem.configure({ nested: true })],
      content: html(value),
      editable: !readonly,
      editorProps: {
        attributes: { role: 'textbox', 'aria-label': 'Description', 'aria-multiline': 'true' },
        transformPastedHTML: (content) => DOMPurify.sanitize(content, { USE_PROFILES: { html: true } }),
        handlePaste: (_view, event) => {
          if (event.clipboardData?.getData('text/html')) return false;
          const text = event.clipboardData?.getData('text/plain');
          if (!text || readonly) return false;
          event.preventDefault();
          editor?.commands.insertContent(html(text));
          return true;
        },
      },
      onUpdate: ({ editor }) => {
        empty = editor.isEmpty;
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

<div bind:this={host} class="markdown-editor" class:empty data-placeholder="Write about it…"></div>

<style>
  .markdown-editor { position: relative; min-height: 72px; color: rgb(var(--gray-900)); line-height: 1.65; overflow-wrap: anywhere; }
  .empty::before { position: absolute; top: 0; content: attr(data-placeholder); color: rgb(var(--gray-400)); pointer-events: none; }
  .markdown-editor :global(.ProseMirror) { min-height: 72px; outline: none; }
  .markdown-editor :global(p) { margin: 0 0 12px; }
  .markdown-editor :global(h1), .markdown-editor :global(h2), .markdown-editor :global(h3), .markdown-editor :global(h4), .markdown-editor :global(h5), .markdown-editor :global(h6) { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 20px 0 12px; }
  .markdown-editor :global(.ProseMirror > :first-child) { margin-top: 0; }
  .markdown-editor :global(.ProseMirror > :last-child) { margin-bottom: 0; }
  .markdown-editor :global(ul) { list-style: disc; padding-left: 24px; margin: 12px 0; }
  .markdown-editor :global(ol) { list-style: decimal; padding-left: 24px; margin: 12px 0; }
  .markdown-editor :global(li p) { margin: 0; }
  .markdown-editor :global(ul[data-type='taskList']) { list-style: none; padding-left: 0; }
  .markdown-editor :global(li[data-type='taskItem']) { display: flex; align-items: baseline; gap: 8px; }
  .markdown-editor :global(a) { color: #3664ff; text-decoration: underline; }
  .markdown-editor :global(pre) { overflow-x: auto; border-radius: 8px; background: rgb(var(--panel)); padding: 12px; margin: 12px 0; }
  .markdown-editor :global(code) { font-size: 0.9em; }
  .markdown-editor :global(blockquote) { border-left: 3px solid rgb(var(--gray-300)); padding-left: 16px; margin: 12px 0; color: rgb(var(--gray-500)); }
  .markdown-editor :global(img) { max-width: 100%; height: auto; }
  .markdown-editor :global(table) { border-collapse: collapse; width: 100%; }
  .markdown-editor :global(.tableWrapper) { overflow-x: auto; }
  .markdown-editor :global(th), .markdown-editor :global(td) { border: 1px solid rgb(var(--gray-200)); padding: 6px 10px; }
  .markdown-editor :global(hr) { margin: 20px 0; border-top: 1px solid rgb(var(--gray-200)); }
</style>
