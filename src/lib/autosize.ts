export function autosize(node: HTMLTextAreaElement, value: string) {
  let width = -1;
  const resize = () => {
    if (!node.getClientRects().length) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };
  node.style.overflow = 'hidden';
  const observer = new ResizeObserver(() => {
    const nextWidth = node.getBoundingClientRect().width;
    if (nextWidth !== width) {
      width = nextWidth;
      resize();
    }
  });
  observer.observe(node);
  node.addEventListener('input', resize);
  resize();
  return {
    update(next: string) {
      if (next !== value) {
        value = next;
        resize();
      }
    },
    destroy() {
      observer.disconnect();
      node.removeEventListener('input', resize);
    },
  };
}
