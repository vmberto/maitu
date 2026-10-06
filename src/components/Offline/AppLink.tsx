'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';

// Main screens share a cached shell; update its URL without requesting HTML or RSC.
export function AppLink({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.download !== undefined ||
      (props.target && props.target !== '_self')
    )
      return;
    const url = new URL(href, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !['/', '/tasks', '/timeline', '/tasks/map', '/archived'].includes(
        url.pathname,
      )
    )
      return;
    event.preventDefault();
    window.history.pushState(null, '', url.pathname + url.search + url.hash);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return <a {...props} href={href} onClick={navigate} />;
}
