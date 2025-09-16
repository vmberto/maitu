import { UserInfoSlideOverWrapper } from '@/src/app/(main)/components/UserInfoSlideOver/server';
import { Typography } from '@/src/components/Typography/Typography';

export const MaituHeader = () => {
  return (
    <header className="bg-gray-100">
      <div className="mx-auto my-0 flex max-w-2xl flex-row items-center px-6 py-3 ">
        <Typography as="h1" className="text-xl font-semibold text-primary">
          maitu
        </Typography>
        <UserInfoSlideOverWrapper />
      </div>
    </header>
  );
};
