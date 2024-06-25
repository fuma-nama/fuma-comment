import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/next";
import { createAdapter } from "@fuma-comment/prisma-adapter";
import type { Comment } from "@fuma-comment/server";
import { prisma } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter: createAdapter({
    db: prisma,
    joinUser: async (comments) => {
      const authorIds = comments.map((c) => c.authorId);
      const profiles = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
        },
        where: {
          id: {
            in: authorIds,
          },
        },
      });

      return comments.flatMap((comment) => {
        const profile = profiles.find((p) => p.id === comment.authorId);
        if (!profile) return [];

        return {
          ...comment,
          author: {
            id: profile.id,
            name: profile.name ?? "",
            image: profile.image ?? undefined,
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
