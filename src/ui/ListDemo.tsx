import Dropdown from '@/components/Dropdown';

interface ListDemoProps {
  onClick?: () => void;
  title: string;
}
export const ListDemo = ({ onClick, title }: ListDemoProps) => {
  return (
    <div
      onClick={onClick}
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
  );
};
