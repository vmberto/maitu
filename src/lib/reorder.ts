import { tick } from 'svelte';
import { engine } from '#lib/offline';
export function sortable(
  node: HTMLElement,
  options: {
    ids: string[];
    kind: 'lists' | 'tasks';
    error: (message: string) => void;
    orderIds?: string[];
    preview?: (ids: string[] | null) => void;
    drop?: (id: string, folderId: string) => Promise<void>;
  },
) {
  let settling = false;
  let slots: { id: string; center: number }[] = [];
  let listBounds: DOMRect | null = null;
  let scrollTop = 0;
  let ghost: HTMLElement | null = null;
  let dragged: HTMLElement | null = null;
  let dropTarget: HTMLElement | null = null;
  let startDrag: (() => void) | undefined;
  let origin = { x: 0, y: 0 };
  const cleanup = () => {
    if (dragged) options.preview?.(null);
    dragged?.removeAttribute('data-sort-dragging');
    dropTarget?.removeAttribute('data-drag-over');
    dropTarget = null;
    startDrag = undefined;
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
      const visible = new Set(ids);
      let position = 0;
      const ordered = options.orderIds?.map((id) => visible.has(id) ? ids[position++] : id) ?? ids;
      await engine.commit(() =>
        ordered.map((entityId, index) => ({
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
  let pending: { id: number; x: number; y: number; type: string } | null = null;
  let touchId: number | null = null;
  let suppressClick = false;
  const down = (event: Pick<PointerEvent, 'button' | 'isPrimary' | 'target' | 'pointerId' | 'clientX' | 'clientY' | 'pointerType'>) => {
    suppressClick = false;
    if (settling) return;
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      (event.target as Element).closest('button:not([data-sort-key]),select')
    )
      return;
    const item = (event.target as Element).closest<HTMLElement>(
      '[data-sort-id]',
    );
    if (!item || !options.ids.includes(item.dataset.sortId ?? '')) return;
    pending = { id: event.pointerId, x: event.clientX, y: event.clientY, type: event.pointerType };
    startDrag = () => {
      if (!pending) return;
      source = item.dataset.sortId ?? '';
      target = source;
      dragged = item;
      scrollTop = window.scrollY + node.scrollTop;
      slots = options.preview ? Array.from(node.querySelectorAll<HTMLElement>('[data-sort-id]'))
        .filter((row) => options.ids.includes(row.dataset.sortId ?? ''))
        .map((row) => {
          const rect = row.getBoundingClientRect();
          return { id: row.dataset.sortId!, center: rect.top + rect.height / 2 };
        }) : [];
      listBounds = item.parentElement!.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      ghost = item.cloneNode(true) as HTMLElement;
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      ghost.dataset.sortGhost = '';
      ghost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;z-index:1000;pointer-events:none;background:rgb(var(--surface));box-shadow:0 16px 36px #0003;border-radius:8px;`;
      ghost.style.setProperty(
        '--list-color',
        getComputedStyle(item).getPropertyValue('--list-color'),
      );
      (node.closest('dialog') ?? document.body).appendChild(ghost);
      item.style.opacity = '.25';
      item.dataset.sortDragging = '';
      ghost.style.transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'scale 160ms cubic-bezier(.2,.8,.2,1), opacity 160ms';
      ghost.style.scale = '1.025';
      ghost.style.transform = 'rotate(1deg)';
      origin = { x: pending.x, y: pending.y };
      suppressClick = true;
      if (options.kind !== 'lists' || pending.type !== 'touch') node.setPointerCapture(pending.id);
    };
    if ((event.target as Element).closest('[data-sort-key]')) startDrag();
    else hold = setTimeout(startDrag, 350);
  };
  const drag = (event: PointerEvent) => {
    if (settling || (options.kind === 'lists' && event.pointerType === 'touch')) return;
    if (!source) {
      if (pending && event.pointerType === 'mouse' &&
        Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 6) {
        clearTimeout(hold);
        startDrag?.();
      } else if (
        pending &&
        Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 24
      ) {
        clearTimeout(hold);
        pending = null;
      }
      if (!source) return;
    }
    event.preventDefault();
    updateDrag(event.clientX, event.clientY);
  };
  function updateDrag(clientX: number, clientY: number) {
    const hit = document.elementFromPoint(clientX, clientY);
    const badge = options.drop ? hit?.closest<HTMLElement>('[data-folder-drop]') : null;
    const nextDrop = badge && node.contains(badge) ? badge : null;
    if (nextDrop !== dropTarget) {
      dropTarget?.removeAttribute('data-drag-over');
      dropTarget = nextDrop;
      dropTarget?.setAttribute('data-drag-over', '');
      if (ghost) {
        ghost.style.scale = dropTarget ? '.12' : '1.025';
        ghost.style.opacity = dropTarget ? '.65' : '1';
      }
    }
    if (ghost) {
      const dx = clientX - origin.x;
      if (dropTarget) {
        const badgeRect = dropTarget.getBoundingClientRect();
        const x = badgeRect.left + badgeRect.width / 2 - parseFloat(ghost.style.left) - ghost.offsetWidth / 2;
        const y = badgeRect.top + badgeRect.height / 2 - parseFloat(ghost.style.top) - ghost.offsetHeight / 2;
        ghost.style.translate = `${x}px ${y}px`;
        ghost.style.transform = 'rotate(0deg)';
      } else {
        ghost.style.translate = `${options.preview ? Math.max(-12, Math.min(12, dx)) : dx}px ${clientY - origin.y}px`;
        ghost.style.transform = 'rotate(1deg)';
      }
    }
    const item = hit?.closest<HTMLElement>('[data-sort-id]');
    let nextTarget = target;
    if (dropTarget) nextTarget = source;
    else if (options.preview && listBounds) {
      // Use fixed slots, not the moving cards; keep an 8px buffer at each boundary.
      const y = clientY + window.scrollY + node.scrollTop - scrollTop;
      if (clientX >= listBounds.left && clientX <= listBounds.right && y >= listBounds.top && y <= listBounds.bottom) {
        let index = slots.findIndex((slot) => slot.id === target);
        while (index < slots.length - 1 && y > (slots[index].center + slots[index + 1].center) / 2 + 8) index++;
        while (index > 0 && y < (slots[index - 1].center + slots[index].center) / 2 - 8) index--;
        nextTarget = slots[index].id;
      }
    } else nextTarget = item && node.contains(item) ? item.dataset.sortId ?? source : source;
    if (nextTarget !== target) {
      target = nextTarget;
      const ids = [...options.ids];
      ids.splice(ids.indexOf(target), 0, ids.splice(ids.indexOf(source), 1)[0]);
      options.preview?.(ids);
    }
    if (clientY < 64) window.scrollBy(0, -12);
    else if (clientY > window.innerHeight - 64) window.scrollBy(0, 12);
  }
  const up = async () => {
    if (settling) return;
    const pendingPointer = pending?.id ?? -1;
    clearTimeout(hold);
    pending = null;
    if (node.hasPointerCapture?.(pendingPointer)) node.releasePointerCapture(pendingPointer);
    if (!source) { cleanup(); return; }
    settling = true;
    await tick();
    const destination = (dropTarget ?? dragged)?.getBoundingClientRect();
    if (options.preview && destination && dragged && !dropTarget) {
      const transform = new DOMMatrixReadOnly(getComputedStyle(dragged).transform);
      destination.x -= transform.m41;
      destination.y -= transform.m42;
    }
    const animation = options.preview && ghost && destination && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? ghost.animate([
          { translate: getComputedStyle(ghost).translate, transform: getComputedStyle(ghost).transform, scale: getComputedStyle(ghost).scale, opacity: getComputedStyle(ghost).opacity },
          { translate: `${destination.left - parseFloat(ghost.style.left)}px ${destination.top - parseFloat(ghost.style.top)}px`, transform: 'rotate(0deg)', scale: dropTarget ? 0.01 : 1, opacity: dropTarget ? 0 : 1 },
        ], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
      : null;
    const save = dropTarget && options.drop
      ? options.drop(source, dropTarget.dataset.folderDrop ?? '').catch(() =>
          options.error('Could not move this list on your device.'))
      : move(source, target);
    await Promise.all([save, animation?.finished.catch(() => {})]);
    cleanup();
    source = '';
    target = '';
    settling = false;
  };
  const cancel = () => {
    if (settling) return;
    clearTimeout(hold);
    pending = null;
    cleanup();
    source = '';
    target = '';
  };
  const key = (event: KeyboardEvent) => {
    if (settling) return;
    if (event.key === 'Escape' && source) {
      event.preventDefault();
      cancel();
      return;
    }
    if (
      !['ArrowUp', 'ArrowDown'].includes(event.key) ||
      !(event.target as Element).matches('[data-sort-key]') ||
      !node.contains(event.target as Node)
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
  const touchStart = (event: TouchEvent) => {
    if (options.kind !== 'lists') return;
    if (event.touches.length !== 1) { cancel(); touchId = null; return; }
    const finger = event.changedTouches[0];
    down({ target: event.target, button: 0, isPrimary: true, pointerId: finger.identifier, pointerType: 'touch', clientX: finger.clientX, clientY: finger.clientY });
    touchId = pending ? finger.identifier : null;
  };
  const touchMove = (event: TouchEvent) => {
    if (options.kind !== 'lists') { if (source) event.preventDefault(); return; }
    if (touchId === null || settling) return;
    const finger = Array.from(event.changedTouches).find((touch) => touch.identifier === touchId);
    if (!finger) return;
    if (source) {
      if (event.cancelable) event.preventDefault();
      updateDrag(finger.clientX, finger.clientY);
    } else if (pending && Math.hypot(finger.clientX - pending.x, finger.clientY - pending.y) > 10) {
      cancel();
    }
  };
  const touchEnd = (event: TouchEvent) => {
    if (touchId === null || !Array.from(event.changedTouches).some((touch) => touch.identifier === touchId)) return;
    touchId = null;
    if (source && event.cancelable) event.preventDefault();
    void up();
  };
  const touchCancel = () => { if (touchId !== null) { touchId = null; cancel(); } };
  const pointerDown = (event: PointerEvent) => {
    if (options.kind !== 'lists' || event.pointerType !== 'touch') down(event);
  };
  const pointerUp = (event: PointerEvent) => {
    if (options.kind !== 'lists' || event.pointerType !== 'touch') void up();
  };
  const pointerCancel = (event: PointerEvent) => {
    // A browser can cancel pointer events while the corresponding touch stream continues.
    if (options.kind !== 'lists' || event.pointerType !== 'touch') cancel();
  };
  const nativeDrag = (event: DragEvent) => event.preventDefault();
  const context = (event: Event) => {
    if (pending || source) event.preventDefault();
  };
  node.addEventListener('dragstart', nativeDrag);
  node.addEventListener('click', click, true);
  node.addEventListener('touchstart', touchStart, { passive: true });
  node.addEventListener('touchmove', touchMove, { passive: false });
  node.addEventListener('touchend', touchEnd, { passive: false });
  node.addEventListener('touchcancel', touchCancel);
  node.addEventListener('contextmenu', context);
  node.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', drag, { passive: false });
  window.addEventListener('pointerup', pointerUp, { passive: false });
  window.addEventListener('pointercancel', pointerCancel, { passive: false });
  window.addEventListener('keydown', key);
  return {
    update(value: typeof options) {
      options = value;
    },
    destroy() {
      clearTimeout(hold);
      pending = null;
      cleanup();
      node.removeEventListener('dragstart', nativeDrag);
      node.removeEventListener('click', click, true);
      node.removeEventListener('touchstart', touchStart);
      node.removeEventListener('touchmove', touchMove);
      node.removeEventListener('touchend', touchEnd);
      node.removeEventListener('touchcancel', touchCancel);
      node.removeEventListener('contextmenu', context);
      node.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', drag);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerCancel);
      window.removeEventListener('keydown', key);
    },
  };
}
