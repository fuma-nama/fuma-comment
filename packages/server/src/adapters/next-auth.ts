import {
	getServerSession,
	type Session,
	type NextAuthOptions,
} from "next-auth";
import type { AuthAdapter } from "../adapter";
import type { CustomRequest } from "../custom";

export function createNextAuthAdapter(
	authOptions: NextAuthOptions,
	options: {
		sessionId?: keyof Required<Session>["user"];
	} = {},
): AuthAdapter<CustomRequest> {
	const { sessionId = "email" } = options;

	return {
		async getSession() {
			const session = await getServerSession(authOptions);
			if (!session?.user?.[sessionId]) return null;

			return {
				id: session.user[sessionId],
			};
		},
	};
}
