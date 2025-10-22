import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthOptions } from "next-auth";
import GithubProvider, { type GithubProfile } from "next-auth/providers/github";
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
      username?: string;
    };
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.uid as string;
      }

      return session;
    },
    jwt: ({ user, token }) => {
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
      profile(profile: GithubProfile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
};
