import {
	and,
	eq,
	gt,
	lt,
	desc,
	asc,
	sql,
	count,
	aliasedTable,
	not,
	inArray,
	like,
	isNull,
} from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { StorageAdapter } from "../adapter";
import type { UserProfile, Comment } from "../types";

export interface Options {
	db: unknown;
	schemas?: {
		comments: unknown;
		rates: unknown;
		roles: unknown;
		user?: unknown;
	};

	auth: StorageAuthProvider | "next-auth" | "better-auth";
}

export interface StorageAuthProvider
	extends Pick<StorageAdapter, "queryUsers"> {
	/**
	 * Manually join User table after selecting comments
	 */
	getUsers: (userIds: string[]) => UserProfile[] | Promise<UserProfile[]>;
}

/**
 * Create adapter for drizzle
 */
export function createDrizzleAdapter(options: Options): StorageAdapter {
	const db = options.db as BaseSQLiteDatabase<"async", unknown>;
	const { schemas = db._.fullSchema } = options;
	// biome-ignore lint/suspicious/noExplicitAny: don't overcomplicate the types
	const { comments, rates, roles } = schemas as Record<string, any>;
	if (!comments || !rates || !roles) {
		throw new Error(
			"Missing required schemas, pass the full schema to the `schemas` option",
		);
	}

	let auth: StorageAuthProvider;
	if (options.auth === "next-auth" || options.auth === "better-auth") {
		auth = createGenericProvider(db, options);
	} else {
		auth = options.auth;
	}

	const getUsers = auth.getUsers;
	return {
		async getComments({ auth, sort, page, after, thread, before, limit }) {
			const likes = aliasedTable(rates, "likes");
			const dislikes = aliasedTable(rates, "dislikes");

			const result = await db
				.select({
					comments,
					selfRate: rates,
					likes: count(likes.userId),
					dislikes: count(dislikes.userId),
				})
				.from(comments)
				.where(
					and(
						page ? eq(comments.page, page) : undefined,
						thread
							? eq(comments.thread, Number(thread))
							: isNull(comments.thread),
						before ? lt(comments.timestamp, before) : undefined,
						after ? gt(comments.timestamp, after) : undefined,
					),
				)
				.orderBy(
					sort === "newest"
						? desc(comments.timestamp)
						: asc(comments.timestamp),
				)
				.limit(limit)
				.leftJoin(
					rates,
					auth
						? and(eq(rates.commentId, comments.id), eq(rates.userId, auth.id))
						: sql<boolean>`false`,
				)
				.leftJoin(likes, and(eq(likes.commentId, comments.id), likes.like))
				.leftJoin(
					dislikes,
					and(eq(dislikes.commentId, comments.id), not(dislikes.like)),
				)
				.groupBy(comments.id, rates.userId, rates.commentId);

			const userInfos = await getUsers(result.map((c) => c.comments.author));

			return await Promise.all(
				result.map(async (row) => {
					const replies = await db
						.select({
							count: count(),
						})
						.from(comments)
						.where(eq(comments.thread, row.comments.id));

					return {
						id: String(row.comments.id),
						author: userInfos.find((c) => c.id === row.comments.author) ?? {
							id: "unknown",
							name: "Deleted User",
						},
						content: row.comments.content as object,
						likes: row.likes,
						dislikes: row.dislikes,
						replies: replies[0].count,
						timestamp: row.comments.timestamp,
						liked: row.selfRate?.like,
						page: row.comments.page,
						threadId: row.comments.thread
							? String(row.comments.thread)
							: undefined,
					} satisfies Comment;
				}),
			);
		},
		async deleteComment({ id, page }) {
			await db
				.delete(comments)
				.where(and(eq(comments.id, Number(id)), eq(comments.page, page)));
		},
		async deleteRate({ auth, id }) {
			await db
				.delete(rates)
				.where(and(eq(rates.commentId, Number(id)), eq(rates.userId, auth.id)));
		},
		async postComment({ auth, body, page }) {
			const data = {
				author: auth.id,
				content: body.content as object,
				page,
				thread: body.thread ? Number(body.thread) : undefined,
			};

			const v = (
				(await db.insert(comments).values(data).returning()) as {
					id: number;
					timestamp: Date;
					thread: number | null;
					author: string;
					content: object;
					page: string;
				}[]
			)[0];

			return {
				id: String(v.id),
				timestamp: v.timestamp,
				threadId: v.thread ? String(v.thread) : undefined,
				page,
				author: (await getUsers([v.author]))[0],
				content: v.content as object,
				likes: 0,
				dislikes: 0,
				replies: 0,
			} satisfies Comment;
		},
		async setRate({ id, auth, body }) {
			const result = (await db
				.update(rates)
				.set({ like: body.like })
				.where(
					and(eq(rates.commentId, Number(id)), eq(rates.userId, auth.id)),
				)) as { rowCount: number };

			if (result.rowCount === 0) {
				await db.insert(rates).values({
					like: body.like,
					userId: auth.id,
					commentId: Number(id),
				});
			}
		},
		async updateComment({ id, auth, body, page }) {
			await db
				.update(comments)
				.set({ content: body.content as object })
				.where(
					and(
						eq(comments.author, auth.id),
						eq(comments.id, Number(id)),
						eq(comments.page, page),
					),
				);
		},
		async getCommentAuthor({ id }) {
			const res = await db
				.select({
					author: comments.author,
				})
				.from(comments)
				.where(eq(comments.id, Number(id)));

			return res.at(0)?.author ?? null;
		},
		async getRole({ auth }) {
			const res = await db
				.select({
					role: roles,
				})
				.from(roles)
				.where(eq(roles.userId, auth.id));

			return res.at(0)?.role ?? null;
		},
	};
}

/**
 * Create a generic provider for NextAuth or BetterAuth,
 * which is used to get user information from the database
 *
 * Note: this is because both of them has a similar database structure.
 */
function createGenericProvider(
	db: BaseSQLiteDatabase<"async", unknown>,
	options: Options,
): StorageAuthProvider {
	// biome-ignore lint/suspicious/noExplicitAny: don't overcomplicate the types
	const { user } = options.schemas ?? (db._.fullSchema as Record<string, any>);

	return {
		getUsers: async (userIds) => {
			const res = await db
				.select({
					id: user.id,
					name: user.name,
					image: user.image,
				})
				.from(user)
				.where(inArray(user.id, userIds));

			return res.map((user) => ({
				id: user.id,
				image: user.image ?? undefined,
				name: user.name ?? "Unknown User",
			}));
		},
		queryUsers: async ({ name, limit }) => {
			const res = await db
				.select({
					id: user.id,
					name: user.name,
					image: user.image,
				})
				.from(user)
				.where(like(user.name, name))
				.limit(limit);

			return res.map((user) => ({
				id: user.id,
				image: user.image ?? undefined,
				name: user.name ?? "Unknown User",
			}));
		},
	};
}
