import { NextComment } from "@fuma-comment/server/next";
import { createBetterAuthAdapter } from "@fuma-comment/server/adapters/better-auth";
import { auth } from "@/lib/auth";
import { createMongoDBAdapter } from "@fuma-comment/server/adapters/mongo-db";
import { db } from "@/lib/database";
import { ObjectId } from "mongodb";
import type { UserProfile } from "@fuma-comment/server";

export const { GET, DELETE, PATCH, POST } = NextComment({
	mention: { enabled: true },
	auth: createBetterAuthAdapter(auth),
	storage: createMongoDBAdapter({
		db,
		auth: {
			async getUsers(userIds) {
				const result = await db
					.collection("user")
					.find({
						_id: {
							$in: userIds.map((v) => new ObjectId(v)),
						},
					})
					.toArray();

				return result.map(({ _id, ...res }) => ({
					...res,
					id: _id.toString(),
				})) as UserProfile[];
			},
		},
	}),
});
