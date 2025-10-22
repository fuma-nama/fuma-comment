import type { InferFumaDB } from "fumadb";
import type { StorageAdapter, StorageAuthProvider } from "../adapter";
import type { FumaCommentDB } from "../db";
import type { Comment } from "../types";

export interface Options {
	client: InferFumaDB<typeof FumaCommentDB>;
	auth: StorageAuthProvider;
}

export { FumaCommentDB } from "../db";

export function createFumaDBAdapter({
	client,
	auth: { getUsers },
}: Options): StorageAdapter {
	const orm = client.orm("1.0.0");

	return {
		async getComments({ auth, ...options }) {
			const comments = await orm.findMany("comments", {
				limit: options.limit,
				orderBy: ["timestamp", options.sort === "newest" ? "desc" : "asc"],
				where: (b) =>
					b.and(
						options.page ? b("page", "=", options.page) : true,
						options.thread ? b("thread", "=", options.thread) : true,
						options.after ? b("timestamp", ">", options.after) : true,
						options.before ? b("timestamp", "<", options.before) : true,
					),
			});

			const users = await getUsers(comments.map((comment) => comment.author));

			const selfRates = auth
				? await orm.findMany("rates", {
						limit: comments.length,
						select: ["commentId", "like"],
						where: (b) =>
							b.and(
								b("userId", "=", auth.id),
								b(
									"commentId",
									"in",
									comments.map((comment) => comment.id),
								),
							),
					})
				: undefined;

			return Promise.all(
				comments.map(async (comment) => {
					return {
						...comment,
						author: users.find((user) => user.id === comment.author) ?? {
							id: "deleted",
							name: "Deleted User",
						},
						replies: await orm.count("comments", {
							where: (b) => b("thread", "=", comment.id),
						}),
						likes: await orm.count("rates", {
							where: (b) =>
								b.and(b("commentId", "=", comment.id), b("like", "=", true)),
						}),
						dislikes: await orm.count("rates", {
							where: (b) =>
								b.and(b("commentId", "=", comment.id), b("like", "=", false)),
						}),
						liked: selfRates?.find((item) => item.commentId === comment.id)
							?.like,
						content: comment.content as object,
					} satisfies Comment;
				}),
			);
		},
		async deleteComment(options) {
			await orm.deleteMany("comments", {
				where: (b) => b("id", "=", options.id),
			});
		},
		async deleteRate(options) {
			await orm.deleteMany("rates", {
				where: (b) =>
					b.and(
						b("commentId", "=", options.id),
						b("userId", "=", options.auth.id),
					),
			});
		},
		async setRate({ id, auth, body }) {
			await orm.upsert("rates", {
				where: (b) => b.and(b("commentId", "=", id), b("userId", "=", auth.id)),
				create: {
					commentId: id,
					userId: auth.id,
					like: body.like,
				},
				update: {
					like: body.like,
				},
			});
		},
		async postComment({ auth, body, page }) {
			const data = {
				author: auth.id,
				content: body.content,
				page,
				thread: body.thread ?? null,
			};
			const inserted = await orm.create("comments", data);
			return {
				id: inserted.id,
				timestamp: inserted.timestamp,
				threadId: inserted.thread ?? undefined,
				page: inserted.page,
				author: (await getUsers([inserted.author]))[0],
				content: inserted.content as object,
				likes: 0,
				dislikes: 0,
				replies: 0,
			} satisfies Comment;
		},
		async updateComment({ id, auth, body, page }) {
			await orm.updateMany("comments", {
				set: { content: body.content },
				where: (b) =>
					b.and(
						b("id", "=", id),
						b("author", "=", auth.id),
						b("page", "=", page),
					),
			});
		},
		async getCommentAuthor({ id }) {
			const comment = await orm.findFirst("comments", {
				select: ["author"],
				where: (b) => b("id", "=", id),
			});
			return comment?.author ?? null;
		},
		async getRole({ auth }) {
			const role = await orm.findFirst("roles", {
				where: (b) => b("userId", "=", auth.id),
			});
			return role ?? null;
		},
	};
}
