import Dropdown from '@/components/Dropdown';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ListDemoProps {
  _id: string;
  title: string;
  actions: ReactNode | undefined;
}
export const ListDemo = ({ _id, title }: ListDemoProps) => {
  return (
    <Link href={`/list/${_id}`}>
      <div
        className="my-2.5
        transition-all cursor-pointer
         border-l-detail border-primary
         bg-white p-4 rounded-md font-semibold items-center
         flex align-middle hover:border-l-detail-hover shadow-sm">
        <h1>{title}</h1>
        <div className="ml-auto">
          <Dropdown />
        </div>
      </div>
    </Link>
  );
};
