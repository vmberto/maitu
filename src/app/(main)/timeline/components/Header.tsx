'use client';
import { AppHeader } from '@/src/components/AppHeader';
import { useTimeline } from '@/src/app/(main)/timeline/state/provider';
export const Header = () => {
  const { selectedList } = useTimeline();
  return <AppHeader list={selectedList} />;
};
