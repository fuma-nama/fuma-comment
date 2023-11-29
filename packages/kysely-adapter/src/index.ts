import {
  type Comment,
  RouteError,
  type StorageAdapter,
} from "@fuma-comment/server";
import { type Kysely, type Generated } from "kysely";

interface CommentTable {
  id: Generated<number>;
  threadId?: number;
  page?: string;
  author: string;
  content: object;
  timestamp: Generated<Date>;
}

interface RateTable {
  userId: string;
  commentId: number;
  like: boolean;
}

export interface Database {
  comments: CommentTable;
  rates: RateTable;
}

type CommentWithoutUser = Omit<Comment, "author"> & { authorId: string };

interface Options<DB extends Database = Database> {
  db: Kysely<DB>;

  /**
   * Fetch user profiles from the authorId property in comments
   */
  joinUser: (comments: CommentWithoutUser[]) => Comment[] | Promise<Comment[]>;
}

/**
 * Create storage adapter for Kysely
 *
 * ```
 * const adapter = createAdapter({ db })
 * ```
 *
 * The `users` table is required for authentication, you may change its name.
 *
 * ```
 * const adapter = createAdapter({ db, userTableName: "User" })
 * ```
 *
 * Moreover, you can manually select users from comments instead if `users` table doesn't exist
 *
 * ```
 * createAdapter({ db, joinUser: comments => ... })
 * ```
 *
 * Example migration: {@link https://github.com/fuma-nama/fuma-comment/blob/main/packages/kysely-adapter/migrations/000-init.ts}
 */
export function createAdapter<DB extends Database = Database>(
  options: Options<DB>
): StorageAdapter {
  // bypress type errors
  return _create(options as unknown as Options);
}

function _create({ db, joinUser }: Options): StorageAdapter {
  return {
    async getComments({ auth, sort, thread, page }) {
      let query = db
        .selectFrom("comments")
        .leftJoin("rates", "comments.id", "rates.commentId")
        .select(({ fn, selectFrom }) => {
          return [
            "comments.content",
            "comments.id",
            "comments.threadId",
            "comments.timestamp",
            "comments.author",
            fn
              .count<number>("rates.userId")
              .filterWhere("rates.like", "=", true)
              .as("likes"),
            fn
              .count<number>("rates.userId")
              .filterWhere("rates.like", "=", false)
              .as("dislikes"),
            selectFrom("comments as replies")
              .select(({ fn: sFn }) => [
                sFn.count<number>("replies.id").as("replies"),
              ])
              .whereRef("replies.threadId", "=", "comments.id")
              .as("replies"),
            selectFrom("rates")
              .select("rates.like")
              .where("rates.userId", "=", auth?.id ?? null)
              .whereRef("rates.commentId", "=", "comments.id")
              .as("liked"),
          ];
        })
        .groupBy(["comments.id"]);

      if (sort === "newest") {
        query = query.orderBy("timestamp desc");
      } else {
        query = query.orderBy("timestamp asc");
      }

      if (page) {
        query = query.where("comments.page", "=", page);
      } else {
        query = query.where("comments.page", "is", null);
      }

      if (thread) {
        query = query.where("comments.threadId", "=", Number(thread));
      } else {
        query = query.where("comments.threadId", "is", null);
      }

      const comments = await query.execute();

      return joinUser(
        comments.map((comment) => ({
          content: comment.content,
          dislikes: Number(comment.dislikes),
          likes: Number(comment.likes),
          id: Number(comment.id),
          timestamp: comment.timestamp,
          replies: Number(comment.replies ?? 0),
          liked: comment.liked ?? undefined,
          threadId: comment.threadId ?? undefined,
          authorId: comment.author,
        }))
      );
    },
    async deleteComment({ auth, id }) {
      const target = await db
        .selectFrom("comments")
        .select("author")
        .where("id", "=", Number(id))
        .executeTakeFirst();

      if (!target || target.author !== auth.id)
        throw new RouteError({
          statusCode: 401,
          message: "Missing permissions",
        });

      await db
        .deleteFrom("comments")
        .where((eb) =>
          eb.or([
            eb("comments.id", "=", Number(id)),
            eb("comments.threadId", "=", Number(id)),
          ])
        )
        .execute();
    },
    async postComment({ auth, body }) {
      await db
        .insertInto("comments")
        .values({
          author: auth.id,
          content: body.content,
          threadId: body.thread,
          page: body.page,
          timestamp: new Date(Date.now()),
        })
        .execute();
    },
    async deleteRate({ auth, id }) {
      await db
        .deleteFrom("rates")
        .where("rates.commentId", "=", Number(id))
        .where("rates.userId", "=", auth.id)
        .execute();
    },
    async setRate({ id, auth, body }) {
      await db
        .insertInto("rates")
        .values({
          commentId: Number(id),
          userId: auth.id,
          like: body.like,
        })
        .onConflict((c) =>
          c.columns(["userId", "commentId"]).doUpdateSet({ like: body.like })
        )
        .execute();
    },
    async updateComment({ id, auth, body }) {
      const target = await db
        .selectFrom("comments")
        .select(["comments.author"])
        .where("id", "=", Number(id))
        .executeTakeFirst();

      if (!target || target.author !== auth.id)
        throw new RouteError({
          statusCode: 401,
          message: "Missing permissions",
        });

      await db
        .updateTable("comments")
        .where("id", "=", Number(id))
        .set({ content: body.content })
        .execute();
    },
  };
}
