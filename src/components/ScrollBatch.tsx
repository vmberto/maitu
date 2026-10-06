'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollBatch(total: number) {
  const [visibleCount, setVisibleCount] = useState(20);
  return {
    visibleCount,
    loader:
      visibleCount < total ? (
        <ScrollBatch onMore={() => setVisibleCount((count) => count + 20)} />
      ) : null,
  };
}

function ScrollBatch({ onMore }: { onMore: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          onMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onMore]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onMore}
      className="rubber-button my-3 w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-100"
    >
      More tasks
    </button>
  );
}
