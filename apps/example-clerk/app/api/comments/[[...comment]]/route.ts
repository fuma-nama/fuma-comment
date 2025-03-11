import { NextComment } from "@fuma-comment/server/next";
import { storage, clerkAdapter } from "@/lib/comment.config";

export const { GET, DELETE, PATCH, POST } = NextComment({
	// import from comment.config.ts
	auth: clerkAdapter,
	storage,
	mention: {
		enabled: true,
	},
});
