import { PrismaAdapter } from "@auth/prisma-adapter";
import { type AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { z } from "zod";
import { prisma } from "@/utils/database";

const env = z
  .object({ GITHUB_ID: z.string(), GITHUB_SECRET: z.string() })
  .parse(process.env);

declare module "next-auth" {
  export interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string | null;
    };
  }
}

export const authOptions: AuthOptions = {
  // @ts-expect-error -- types
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.uid as string;
      }

      return session;
    },
    jwt: ({ user, token }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this can be null
      if (user) token.uid = user.id;

      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
  ],
};
