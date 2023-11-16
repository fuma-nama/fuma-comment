import { KyselyAdapter } from "@auth/kysely-adapter";
import { type AuthOptions } from "next-auth";
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
