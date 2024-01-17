import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';

import { env } from '~/env.mjs';
import { db } from '~/server/db';
import { mysqlTable } from './db/schema';
import slugify from 'slugify';
import { slugSetting } from '~/utils/constants';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      slug: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession['user'];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: DrizzleAdapter(db, mysqlTable),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user",
          slug: slugify(profile.name, slugSetting),
        };
      },
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  debug: false,
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
