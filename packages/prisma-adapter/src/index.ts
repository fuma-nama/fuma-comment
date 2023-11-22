import type { PrismaClient } from "@prisma/client";
import type { Comment, StorageAdapter } from "@fuma-comment/server";

type CommentWithoutUser = Omit<Comment, "author"> & { authorId: string };

interface Options {
  db: PrismaClient;

  /**
   * Manually join User table after selecting comments
   */
  joinUser: (comments: CommentWithoutUser[]) => Comment[] | Promise<Comment[]>;
}

/**
 * Create adapter for Prisma
 *
 * Example Schema: {@link https://github.com/fuma-nama/fuma-comment/blob/main/packages/prisma-adapter/prisma/schema.prisma}
 */
export function createAdapter({ db, joinUser }: Options): StorageAdapter {
  return {
    async getComments({ auth }) {
      const result = await db.comment.findMany({
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

      const mappedResults = await Promise.all(
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
            authorId: row.author,
            content: row.content,
            likes,
            dislikes,
            replies,
            timestamp: row.timestamp,
            liked: selfRate?.like ?? undefined,
            page: row.page ?? undefined,
            threadId: row.thread ?? undefined,
          } satisfies CommentWithoutUser;
        })
      );

      return joinUser(mappedResults);
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
      await db.comment.createMany({
        data: {
          author: auth.id,
          content: body.content,
          page: body.page,
          thread: body.thread,
        },
      });
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
        data: { content: body.content },
        where: { author: auth.id, id: Number(id) },
      });
    },
  };
}
