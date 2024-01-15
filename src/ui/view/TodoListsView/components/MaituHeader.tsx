import Link from 'next/link';
import { Typography } from 'src/ui/common/Typography';

export const MaituHeader = () => (
  <header className="mx-auto my-0 mt-2.5 flex max-w-3xl flex-row items-center border-b-2 px-6 py-2">
    <Typography as="h1" className="text-xl font-semibold text-primary">
      maitu
    </Typography>
    <Link
      className="ml-auto mr-5 border-b-2 border-primary px-3 py-0.5 text-base text-primary"
      href="/map"
    >
      Map
    </Link>
  </header>
);
