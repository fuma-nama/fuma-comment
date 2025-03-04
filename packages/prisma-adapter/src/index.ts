import type {
  Comment,
  StorageAdapter,
  UserProfile,
} from "@fuma-comment/server";

interface Options {
  db: unknown;

  /**
   * Model name for comment
   */
  CommentModel?: string;

  /**
   * Model name for rate
   */
  RateModel?: string;

  /**
   * Model name for role
   */
  RoleModel?: string;

  /**
   * Manually join User table after selecting comments
   */
  getUsers: (userIds: string[]) => UserProfile[] | Promise<UserProfile[]>;
}

type PrismaClientInternal = Record<string, {
  create: <T>(data: unknown) => Promise<T>;
  findFirst: <T>(data: unknown) => Promise<T | null>;
  findMany: <T>(data: unknown) => Promise<T[]>;
  update: <T>(data: unknown) => Promise<T>;
  updateMany: (data: unknown) => Promise<void>;
  delete: <T>(data: unknown) => Promise<T>;
  deleteMany: (data: unknown) => Promise<void>;
  count: (data: unknown) => Promise<number>;
  upsert: <T>(data: unknown) => Promise<T>;
}>;

/**
 * Create adapter for Prisma
 *
 * Example Schema: {@link https://github.com/fuma-nama/fuma-comment/blob/main/packages/prisma-adapter/prisma/schema.prisma}
 */
export function createAdapter({
  getUsers,
  CommentModel = 'comment',
  RateModel = 'rate',
  RoleModel = 'role',
  ...options
}: Options): StorageAdapter {
  const db = options.db as PrismaClientInternal

  return {
    async getComments({ auth, sort, page, after, thread, before, limit }) {
      const result = await db[CommentModel].findMany<{
        author: string
        id: number
        timestamp: Date
        content: object
        thread: number | null
        page: string
        rates: {
          like: boolean
        }[]
      }>({
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
          const replies = await db[CommentModel].count({
            where: { thread: row.id },
          });
          const likes = await db[RateModel].count({
            where: { commentId: row.id, like: true },
          });
          const dislikes = await db[RateModel].count({
            where: { commentId: row.id, like: false },
          });

          return {
            id: String(row.id),
            author: userInfos.find((c) => c.id === row.author) ?? {
              id: "unknown",
              name: "Deleted User",
            },
            content: row.content,
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
    async deleteComment({ id, page }) {
      await db[CommentModel].deleteMany({
        where: { id: Number(id), page },
      });
    },
    async deleteRate({ auth, id, page }) {
      await db[RateModel].deleteMany({
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
      const data = {
        author: auth.id,
        content: body.content as object,
        page,
        thread: Number(body.thread),
      }

      const v = await db[CommentModel].create<typeof data & {
        id: number
        timestamp: Date
      }>({
        data,
      });

      return {
        id: String(v.id),
        timestamp: v.timestamp,
        threadId: v.thread ? String(v.thread) : undefined,
        page,
        author: (await getUsers([v.author]))[0],
        content: v.content,
        likes: 0,
        dislikes: 0,
        replies: 0,
      } satisfies Comment;
    },
    async setRate({ id, auth, body, page }) {
      await db[RateModel].upsert({
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
      await db[CommentModel].updateMany({
        data: { content: body.content as object },
        where: { author: auth.id, id: Number(id), page },
      });
    },
    async getCommentAuthor({ id }) {
      const res = await db[CommentModel].findFirst<{
        author: string
      }>({
        where: {
          id: Number(id),
        },
      })

      return res?.author ?? null
    },
    async getRole({ auth }) {
      return db[RoleModel].findFirst({
        where: {
          userId: auth.id,
        },
      });
    },
  };
}
