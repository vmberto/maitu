import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default function MyPage() {
  const Map = useMemo(
    () =>
      dynamic(async () => import('src/ui/view/Map'), {
        ssr: false,
      }),
    [],
  );

  return <Map />;
}
