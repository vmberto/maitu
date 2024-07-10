import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { Lucia } from 'lucia';

import { getMongoDb } from '@/src/lib/mongodb';

export const getLuciaAuthAdapter = async () => {
  const db = await getMongoDb();
  return new MongodbAdapter(db.collection('sessions'), db.collection('users'));
};

export const getLucia = async () => {
  const adapter = await getLuciaAuthAdapter();
  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
    getUserAttributes: (attributes: Record<string, string>) => {
      return {
        _id: attributes._id,
        username: attributes.username,
        email: attributes.email,
      };
    },
  });
};

// IMPORTANT!
declare module 'lucia' {
  interface Register {
    Lucia: typeof getLucia;
  }

  interface UserDoc {
    _id: string;
    username: string;
    email: string;
    password: string;
  }

  interface SessionDoc {
    _id: string;
    expiresAt: Date;
    userId: string;
  }
}
