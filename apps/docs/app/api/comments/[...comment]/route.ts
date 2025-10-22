import { createNextAuthAdapter } from "@fuma-comment/server/adapters/next-auth";
import { createPrismaAdapter } from "@fuma-comment/server/adapters/prisma";
import { NextComment } from "@fuma-comment/server/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/utils/database";

export const { GET, DELETE, PATCH, POST } = NextComment({
  role: "database",
  mention: { enabled: true },
  auth: createNextAuthAdapter(authOptions, {
    sessionId: "id",
  }),
  storage: createPrismaAdapter({
    db: prisma,
    auth: "next-auth",
    UserIdField: "id",
  }),
});
