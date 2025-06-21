import type { AuthAdapter, StorageAuthProvider } from "../adapter";
import type { CustomRequest } from "../custom";
import { type AuthObject, createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

export function ClerkAdapter(
	authObjectFn: (req: CustomRequest) => Promise<AuthObject>,
): AuthAdapter<CustomRequest> & StorageAuthProvider {
	return {
		async getSession(request) {
			const auth = await authObjectFn(request);

			if (!("userId" in auth) || !auth.userId) return null;
			return { id: auth.userId };
		},
		async getUsers(userIds) {
			const result = await clerkClient.users.getUserList({
				userId: userIds,
				limit: userIds.length,
			});

			return result.data.map((user) => ({
				id: user.id,
				name: user.fullName ?? user.username ?? "unknown",
				image: user.imageUrl,
			}));
		},
		async queryUsers(options) {
			const result = await clerkClient.users.getUserList({
				query: options.name,
				limit: options.limit,
			});

			return result.data.map((user) => ({
				id: user.id,
				name: user.fullName ?? user.username ?? "unknown",
				image: user.imageUrl,
			}));
		},
	};
}
