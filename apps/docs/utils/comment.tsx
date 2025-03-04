import { createAdapter } from "@fuma-comment/prisma-adapter";
import { prisma } from "./database";

export const adapter = createAdapter({
	db: prisma,
	async getUsers(userIds) {
		const res = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				image: true,
			},
			where: {
				id: {
					in: userIds,
				},
			},
		});

		return res.map((user) => ({
			...user,
			image: user.image ?? undefined,
			name: user.name ?? "Unknown User",
		}));
	},
});
