import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/next";
import { createAdapter } from "@fuma-comment/kysely-adapter";
import type { Comment } from "@fuma-comment/server";
import { db } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter: createAdapter({
    db,
    joinUser: async (comments) => {
      const authorIds = comments.map((c) => c.authorId);
      const profiles = await db
        .selectFrom("User")
        .select(["User.id", "User.image", "User.name"])
        .where("User.id", "in", authorIds)
        .execute();

      return comments.map((comment) => {
        const profile = profiles.find((p) => p.id === comment.authorId) ?? {
          id: comment.authorId,
          name: comment.authorId,
        };

        return {
          ...comment,
          author: {
            id: profile.id,
            name: profile.name ?? "",
          },
        } satisfies Comment;
      });
    },
  }),
  async getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return {
      id: session.user.id,
    };
  },
});
