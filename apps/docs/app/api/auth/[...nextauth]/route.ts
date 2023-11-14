import { KyselyAdapter } from "@auth/kysely-adapter";
import NextAuth, { type AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { z } from "zod";
import { db } from "@/utils/database";

const env = z
  .object({ GITHUB_ID: z.string(), GITHUB_SECRET: z.string() })
  .parse(process.env);

export const authOptions: AuthOptions = {
  // @ts-expect-error -- Should work for Vercel Storage
  adapter: KyselyAdapter(db),
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- external library
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
