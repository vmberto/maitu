// Leaflet handles its own gestures; these listeners only stop browser page zoom.
export function blockPageZoom() {
  const wheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  };
  const key = (event: KeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      ['+', '=', '-', '0'].includes(event.key)
    )
      event.preventDefault();
  };
  const gesture = (event: Event) => event.preventDefault();
  window.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('keydown', key);
  window.addEventListener('gesturestart', gesture, { passive: false });
  window.addEventListener('gesturechange', gesture, { passive: false });
  return () => {
    window.removeEventListener('wheel', wheel);
    window.removeEventListener('keydown', key);
    window.removeEventListener('gesturestart', gesture);
    window.removeEventListener('gesturechange', gesture);
  };
}
