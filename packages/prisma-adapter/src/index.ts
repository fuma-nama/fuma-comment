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
    async getComments({ auth, sort, page, after, thread, before, limit }) {
      const result = await db.comment.findMany({
        orderBy: [{ timestamp: sort === "newest" ? "desc" : "asc" }],
        where: {
          page,
          thread: Number(thread),
          timestamp: {
            lt: before,
            gt: after,
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
          const replies = await db.comment.count({
            where: { thread: row.id },
          });
          const likes = await db.rate.count({
            where: { commentId: row.id, like: true },
          });
          const dislikes = await db.rate.count({
            where: { commentId: row.id, like: false },
          });

          return {
            id: String(row.id),
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
            page: row.page,
            threadId: row.thread ? String(row.thread) : undefined,
          } satisfies Comment;
        }),
      );
    },
    async deleteComment({ auth, id, page }) {
      await db.comment.delete({
        where: { id: Number(id), author: auth.id, page },
      });
    },
    async deleteRate({ auth, id, page }) {
      await db.rate.deleteMany({
        where: {
          commentId: Number(id),
          userId: auth.id,
          comment: {
            page,
          },
        },
      });
    },
    async postComment({ auth, body, page }) {
      const v = await db.comment.create({
        data: {
          author: auth.id,
          content: body.content as object,
          page,
          thread: Number(body.thread),
        },
      });

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
    async setRate({ id, auth, body, page }) {
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
          comment: {
            page,
          },
        },
      });
    },
    async updateComment({ id, auth, body, page }) {
      await db.comment.updateMany({
        data: { content: body.content as object },
        where: { author: auth.id, id: Number(id), page },
      });
    },
    async getCommentAuthor({ id }) {
      return db.comment
        .findFirst({
          where: {
            id: Number(id),
          },
        })
        .then((res) => res?.author ?? null);
    },
    async getRole({ auth }) {
      return db.role.findFirst({
        where: {
          userId: auth.id,
        },
      });
    },
  };
}
