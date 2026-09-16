import { NextComment } from "@fuma-comment/server/next";
import { github } from "@/lib/comment.config";

export const { GET, POST, PATCH, DELETE } = NextComment({
	role: "database",
	mention: { enabled: true },
	...github,
});
