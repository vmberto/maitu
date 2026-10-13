<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from '@tiptap/markdown';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import Icon from './Icon.svelte';

  let { value, readonly = false, onchange }: { value: string; readonly?: boolean; onchange: (value: string) => void } = $props();
  let host: HTMLDivElement;
  let editor = $state.raw<Editor | null>(null);
  let empty = $state(true);
  let bold = $state(false);
  let bullets = $state(false);
  let lastValue = '';
  const html = (text: string) => DOMPurify.sanitize(marked.parse(text, { async: false, breaks: true }), { USE_PROFILES: { html: true } });

  onMount(() => {
    lastValue = value;
    editor = new Editor({
      element: host,
      extensions: [StarterKit.configure({ underline: false, trailingNode: false, link: { openOnClick: false } }), Markdown],
      enableInputRules: ['bold', 'bulletList'],
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
      onTransaction: ({ editor }) => {
        empty = editor.isEmpty;
        bold = editor.isActive('bold');
        bullets = editor.isActive('bulletList');
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
  {#if !readonly}<div class="formatting" role="group" aria-label="Text formatting">
    <button type="button" aria-label="Bold" aria-pressed={bold} title="Bold (Ctrl/Cmd+B)"
      onmousedown={(event) => event.preventDefault()} onclick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong></button>
    <button type="button" aria-label="Bullet list" aria-pressed={bullets} title="Bullet list"
      onmousedown={(event) => event.preventDefault()} onclick={() => editor?.chain().focus().toggleBulletList().run()}><Icon name="bullets" size={18} /></button>
  </div>{/if}
  <div bind:this={host} class="editor-host" class:empty data-placeholder="Write about it…"></div>
</div>

<style>
  .formatting { display: flex; gap: 4px; margin-bottom: 12px; }
  .formatting button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; color: rgb(var(--gray-500)); }
  .formatting button[aria-pressed='true'] { color: #3664ff; background: rgb(54 100 255 / 10%); }
  .formatting button:focus-visible { outline: 2px solid #3664ff; outline-offset: 2px; }
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
  .markdown-editor :global(a) { display: inline-block; max-width: min(100%, 34ch); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; border-radius: 999px; padding: 2px 8px; background: rgb(54 100 255 / 9%); color: #3664ff; font-size: 13px; text-decoration: none; }
  .markdown-editor :global(pre) { overflow-x: auto; border-radius: 8px; background: rgb(var(--surface)); padding: 12px; margin: 12px 0; }
  .markdown-editor :global(code) { font-size: 0.9em; }
  .markdown-editor :global(blockquote) { border-left: 3px solid rgb(var(--gray-300)); padding-left: 16px; margin: 12px 0; color: rgb(var(--gray-500)); }
  .markdown-editor :global(img) { max-width: 100%; height: auto; }
  .markdown-editor :global(table) { display: block; overflow-x: auto; border-collapse: collapse; max-width: 100%; }
  .markdown-editor :global(th), .markdown-editor :global(td) { border: 1px solid rgb(var(--gray-200)); padding: 6px 10px; }
  .markdown-editor :global(hr) { margin: 20px 0; border-top: 1px solid rgb(var(--gray-200)); }
</style>
