import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/next";
import { createAdapter } from "@fuma-comment/prisma-adapter";
import { prisma } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter: createAdapter({
    db: prisma,
    async getUsers(userIds) {
      const res = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
        },
        where: {
          id: {
            in: userIds,
          },
        },
      });

      return res.map((user) => ({
        ...user,
        image: user.image ?? undefined,
        name: user.name ?? "Unknown User",
      }));
    },
  }),
  role: "database",
  async getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return {
      id: session.user.id,
    };
  },
});
