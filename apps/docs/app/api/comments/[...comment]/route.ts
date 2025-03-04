import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/next";
import { prisma } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { adapter } from "@/utils/comment";

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter,
  role: "database",
  async queryUsers({ name, limit }) {
    const res = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: limit,
      where: {
        name: {
          startsWith: name,
          mode: "insensitive",
        },
      },
    });

    return res.map((user) => ({
      ...user,
      image: user.image ?? undefined,
      name: user.name ?? "Unknown User",
    }));
  },
  async getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return {
      id: session.user.id,
    };
  },
});
