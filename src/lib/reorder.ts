import { engine } from '#lib/offline';
export function sortable(
  node: HTMLElement,
  options: {
    ids: string[];
    kind: 'lists' | 'tasks';
    error: (message: string) => void;
  },
) {
  let ghost: HTMLElement | null = null;
  let dragged: HTMLElement | null = null;
  let origin = { x: 0, y: 0 };
  const cleanup = () => {
    ghost?.remove();
    ghost = null;
    dragged?.style.removeProperty('opacity');
    dragged = null;
  };
  let source = '',
    target = '';
  async function move(from: string, to: string) {
    const ids = [...options.ids];
    const start = ids.indexOf(from),
      end = ids.indexOf(to);
    if (start < 0 || end < 0 || start === end) return;
    ids.splice(end, 0, ids.splice(start, 1)[0]);
    try {
      await engine.commit(() =>
        ids.map((entityId, index) => ({
          kind: options.kind,
          entityId,
          action: 'patch' as const,
          data: { index },
        })),
      );
    } catch {
      options.error('Could not save this order on your device.');
    }
  }
  let hold: ReturnType<typeof setTimeout> | undefined;
  let pending: { id: number; x: number; y: number } | null = null;
  let suppressClick = false;
  const down = (event: PointerEvent) => {
    suppressClick = false;
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      (event.target as Element).closest('button,select')
    )
      return;
    const item = (event.target as Element).closest<HTMLElement>(
      '[data-sort-id]',
    );
    if (!item || !options.ids.includes(item.dataset.sortId ?? '')) return;
    pending = { id: event.pointerId, x: event.clientX, y: event.clientY };
    hold = setTimeout(() => {
      if (!pending) return;
      source = item.dataset.sortId ?? '';
      target = source;
      dragged = item;
      const rect = item.getBoundingClientRect();
      ghost = item.cloneNode(true) as HTMLElement;
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      ghost.dataset.sortGhost = '';
      ghost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;z-index:1000;pointer-events:none;background:rgb(var(--surface));box-shadow:0 8px 20px #0002;border-radius:8px;`;
      ghost.style.setProperty(
        '--list-color',
        getComputedStyle(item).getPropertyValue('--list-color'),
      );
      document.body.appendChild(ghost);
      item.style.opacity = '.25';
      origin = { x: pending.x, y: pending.y };
      suppressClick = true;
      node.setPointerCapture(pending.id);
      event.preventDefault();
    }, 350);
  };
  const drag = (event: PointerEvent) => {
    if (!source) {
      if (
        pending &&
        Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 24
      ) {
        clearTimeout(hold);
        pending = null;
      }
      return;
    }
    event.preventDefault();
    if (ghost)
      ghost.style.transform = `translate(${event.clientX - origin.x}px,${event.clientY - origin.y}px) scale(1.02)`;
    const item = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-sort-id]');
    if (item && node.contains(item)) target = item.dataset.sortId ?? source;
  };
  const up = () => {
    clearTimeout(hold);
    pending = null;
    cleanup();
    if (source) void move(source, target);
    source = '';
    target = '';
  };
  const cancel = () => {
    clearTimeout(hold);
    pending = null;
    cleanup();
    source = '';
    target = '';
  };
  const key = (event: KeyboardEvent) => {
    if (
      !['ArrowUp', 'ArrowDown'].includes(event.key) ||
      !(event.target as Element).matches('[data-sort-key]')
    )
      return;
    const id =
      (event.target as Element).closest<HTMLElement>('[data-sort-id]')?.dataset
        .sortId ?? '';
    const target =
      options.ids[options.ids.indexOf(id) + (event.key === 'ArrowUp' ? -1 : 1)];
    event.preventDefault();
    if (target) void move(id, target);
  };
  const click = (event: MouseEvent) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }
  };
  const touch = (event: TouchEvent) => {
    if (source) event.preventDefault();
  };
  const context = (event: Event) => {
    if (pending || source) event.preventDefault();
  };
  node.addEventListener('click', click, true);
  node.addEventListener('touchmove', touch, { passive: false });
  node.addEventListener('contextmenu', context);
  node.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', drag, { passive: false });
  window.addEventListener('pointerup', up, { passive: false });
  window.addEventListener('pointercancel', cancel, { passive: false });
  node.addEventListener('keydown', key);
  return {
    update(value: typeof options) {
      options = value;
    },
    destroy() {
      clearTimeout(hold);
      pending = null;
      cleanup();
      node.removeEventListener('click', click, true);
      node.removeEventListener('touchmove', touch);
      node.removeEventListener('contextmenu', context);
      node.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', drag);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      node.removeEventListener('keydown', key);
    },
  };
}
