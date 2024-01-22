import NextAuth from 'next-auth';

import { nextAuthOptions } from '@/src/app/api/auth/[...nextauth]/auth-options';

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
