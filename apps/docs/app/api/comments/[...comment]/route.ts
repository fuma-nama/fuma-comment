import { NextComment } from "@fuma-comment/next";
import { prisma } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { createPrismaAdapter } from "@fuma-comment/server/adapters/prisma";
import { createNextAuthAdapter } from "@fuma-comment/server/adapters/next-auth";

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
