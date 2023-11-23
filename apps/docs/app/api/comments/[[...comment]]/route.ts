import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/next";
import { createAdapter } from "@fuma-comment/kysely-adapter";
import { db } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter: createAdapter({
    db,
    userTableName: "User",
  }),
  async getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return {
      id: session.user.id,
    };
  },
});
