export function autosize(node: HTMLTextAreaElement, value: string) {
  const resize = () => {
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };
  resize();
  return {
    update(next: string) {
      if (next !== value) {
        value = next;
        resize();
      }
    },
  };
}
