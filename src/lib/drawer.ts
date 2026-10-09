export function closeDrawer(dialog: HTMLDialogElement) {
  if (dialog.dataset.closing) return;
  dialog.dataset.closing = 'true';
  setTimeout(
    () => {
      dialog.close();
      delete dialog.dataset.closing;
    },
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
  );
}

export function drawerBehavior(
  node: HTMLDialogElement,
  direction: 'bottom' | 'right' = 'bottom',
) {
  node.dataset.direction = direction;
  node.tabIndex = -1;
  const opened = () => {
    if (node.open) node.focus({ preventScroll: true });
  };
  node.addEventListener('toggle', opened);
  const click = (event: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    if (
      event.target === node &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeDrawer(node);
  };
  let start: { x: number; y: number } | null = null;
  const down = (event: PointerEvent) => {
    const control = (event.target as Element).closest<HTMLElement>('input,textarea,button,select,summary');
    if (control) control.dataset.pointerFocus = '';
    if (
      !(event.target as Element).closest('[data-drawer-header]') ||
      (event.target as Element).closest('button,input,textarea')
    )
      return;
    start = { x: event.clientX, y: event.clientY };
    node.setPointerCapture(event.pointerId);
  };
  const up = (event: PointerEvent) => {
    if (
      start &&
      (direction === 'bottom'
        ? event.clientY - start.y
        : event.clientX - start.x) > 80
    )
      closeDrawer(node);
    start = null;
  };
  const cancel = () => {
    start = null;
  };
  node.addEventListener('click', click);
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', cancel);
  const keyboard = () => node.querySelectorAll('[data-pointer-focus]').forEach((element) => element.removeAttribute('data-pointer-focus'));
  node.addEventListener('keydown', keyboard);
  return {
    destroy() {
      node.removeEventListener('toggle', opened);
      node.removeEventListener('keydown', keyboard);
      node.removeEventListener('click', click);
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    },
  };
}
