import { NextComment } from "@fuma-comment/server/next";
import { createBetterAuthAdapter } from "@fuma-comment/server/adapters/better-auth";
import { createDrizzleAdapter } from "@fuma-comment/server/adapters/drizzle";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { comments, rates, roles, user } from "@/lib/schema";

export const { GET, DELETE, PATCH, POST } = NextComment({
	mention: { enabled: true },
	auth: createBetterAuthAdapter(auth),
	storage: createDrizzleAdapter({
		auth: "better-auth",
		db,
		schemas: {
			comments,
			rates,
			roles,
			user,
		},
	}),
});
