let locks = 0;
let restore: (() => void) | null = null;
export function lockBody() {
  if (locks++ === 0) {
    const body = document.body;
    const scrollY = window.scrollY;
    const url = window.location.href;
    const properties = [
      'position',
      'top',
      'left',
      'width',
      'overflow',
    ] as const;
    const saved = properties.map(
      (property) => [property, body.style.getPropertyValue(property)] as const,
    );
    const width = body.getBoundingClientRect().width;
    body.style.position = 'fixed';
    body.style.top = `${-scrollY}px`;
    body.style.left = '0';
    body.style.width = `${width}px`;
    body.style.overflow = 'hidden';
    restore = () => {
      saved.forEach(([property, value]) =>
        value
          ? body.style.setProperty(property, value)
          : body.style.removeProperty(property),
      );
      window.scrollTo({
        top: window.location.href === url ? scrollY : 0,
        behavior: 'instant',
      });
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) {
      restore?.();
      restore = null;
    }
  };
}
