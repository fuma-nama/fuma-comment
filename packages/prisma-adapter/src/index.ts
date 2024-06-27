import type { PrismaClient } from "@prisma/client";
import type {
  Comment,
  StorageAdapter,
  UserProfile,
} from "@fuma-comment/server";

interface Options {
  db: PrismaClient;

  /**
   * Manually join User table after selecting comments
   */
  getUsers: (userIds: string[]) => UserProfile[] | Promise<UserProfile[]>;
}

/**
 * Create adapter for Prisma
 *
 * Example Schema: {@link https://github.com/fuma-nama/fuma-comment/blob/main/packages/prisma-adapter/prisma/schema.prisma}
 */
export function createAdapter({ db, getUsers }: Options): StorageAdapter {
  return {
    async getComments({ auth, sort, page, thread, before, limit }) {
      const result = await db.comment.findMany({
        orderBy: [{ timestamp: sort === "newest" ? "desc" : "asc" }],
        where: {
          page,
          thread: thread ? Number(thread) : null,
          timestamp: {
            lt: before,
          },
        },
        take: limit,
        include: {
          rates: auth
            ? {
                take: 1,
                where: {
                  userId: auth.id,
                },
              }
            : {
                take: 0,
              },
        },
      });
      const userInfos = await getUsers(result.map((c) => c.author));

      return await Promise.all(
        result.map(async (row) => {
          const selfRate = row.rates.length > 0 ? row.rates[0] : null;
          const replies = await db.comment.count({ where: { thread: row.id } });
          const likes = await db.rate.count({
            where: { commentId: row.id, like: true },
          });
          const dislikes = await db.rate.count({
            where: { commentId: row.id, like: false },
          });

          return {
            id: row.id,
            author: userInfos.find((c) => c.id === row.author) ?? {
              id: "unknown",
              name: "Deleted User",
            },
            content: row.content as object,
            likes,
            dislikes,
            replies,
            timestamp: row.timestamp,
            liked: selfRate?.like ?? undefined,
            page: row.page ?? undefined,
            threadId: row.thread ?? undefined,
          } satisfies Comment;
        }),
      );
    },
    async deleteComment({ auth, id }) {
      await db.comment.delete({ where: { id: Number(id), author: auth.id } });
    },
    async deleteRate({ auth, id }) {
      await db.rate.delete({
        where: {
          userId_commentId: { commentId: Number(id), userId: auth.id },
        },
      });
    },
    async postComment({ auth, body }) {
      const v = await db.comment.create({
        data: {
          author: auth.id,
          content: body.content as object,
          page: body.page,
          thread: body.thread,
        },
      });

      return {
        id: v.id,
        liked: false,
        timestamp: v.timestamp,
        threadId: v.thread ?? undefined,
        page: v.page ?? undefined,
        author: (await getUsers([v.author]))[0],
        content: v.content as object,
        likes: 0,
        dislikes: 0,
        replies: 0,
      } satisfies Comment;
    },
    async setRate({ id, auth, body }) {
      await db.rate.upsert({
        create: {
          like: body.like,
          userId: auth.id,
          commentId: Number(id),
        },
        update: {
          like: body.like,
        },
        where: {
          userId_commentId: {
            commentId: Number(id),
            userId: auth.id,
          },
        },
      });
    },
    async updateComment({ id, auth, body }) {
      await db.comment.updateMany({
        data: { content: body.content as object },
        where: { author: auth.id, id: Number(id) },
      });
    },
  };
}
