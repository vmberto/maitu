import bcrypt from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { getMongoDb } from '@/src/lib/mongodb';
import type { UserObject } from '@/types/main';

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      credentials: {
        email: {
          label: 'E-mail',
          type: 'text',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const mongo = await getMongoDb();

        const usersCollection = mongo.collection('users');
        const email = credentials?.email.toLowerCase();
        const user = await usersCollection.findOne<UserObject>({ email });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const passwordIsValid = await bcrypt.compare(
          credentials?.password!,
          user.password,
        );

        if (!passwordIsValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id?.toString() || '',
          _id: user._id,
          username: user.username,
          email: user.email,
          password: '',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // eslint-disable-next-line no-param-reassign
        token.uid = user;
      }

      return token;
    },
    session: async ({ session, token }) => {
      // eslint-disable-next-line no-param-reassign
      session.user = token.uid;
      return session;
    },
  },
};

export const getSessionServerSide = () => getServerSession(nextAuthOptions);
