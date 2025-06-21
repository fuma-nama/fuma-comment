import type { AuthAdapter } from "../adapter";
import type { CustomRequest } from "../custom";

export function createBetterAuthAdapter(auth: {
	api: {
		getSession: (options: {
			headers: Headers;
		}) => Promise<{ user: { id: string } } | undefined | null>;
	};
}): AuthAdapter<CustomRequest> {
	return {
		async getSession(req) {
			const headers = new Headers();

			for (const [key, value] of Array.from(req.headers.entries())) {
				headers.set(key, value as string);
			}

			const session = await auth.api.getSession({
				headers,
			});

			if (!session?.user.id) return null;
			return {
				id: session.user.id,
			};
		},
	};
}
