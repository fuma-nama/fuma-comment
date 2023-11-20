import { RouteError, type StorageAdapter } from "@fuma-comment/server";
import { getServerSession } from "next-auth";
import { NextComment } from "@fuma-comment/server/next";
import { db } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const adapter: StorageAdapter = {
  async getComments({ auth, sort, thread, page }) {
    let query = db
      .selectFrom("comments")
      .innerJoin("User", "User.email", "comments.author")
      .leftJoin("rates", "comments.id", "rates.commentId")
      .select(({ fn, selectFrom }) => {
        return [
          "comments.content",
          "comments.id",
          "comments.threadId",
          "comments.timestamp",
          "User.name as authorName",
          "User.image as authorImage",
          "User.email as authorId",
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
      .groupBy(["comments.id", "User.id"]);

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

    return comments.map((comment) => ({
      content: comment.content,
      dislikes: Number(comment.dislikes),
      likes: Number(comment.likes),
      id: Number(comment.id),
      timestamp: comment.timestamp,
      replies: Number(comment.replies ?? 0),
      liked: comment.liked ?? undefined,
      threadId: comment.threadId ?? undefined,
      author: {
        id: comment.authorId,
        name: comment.authorName ?? "Unknown",
        image: comment.authorImage ?? undefined,
      },
    }));
  },
  async deleteComment({ auth, id }) {
    const target = await db
      .selectFrom("comments")
      .select("author")
      .where("id", "=", Number(id))
      .executeTakeFirst();

    if (!target || target.author !== auth.id)
      throw new RouteError({ statusCode: 401, message: "Missing permissions" });

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
      throw new RouteError({ statusCode: 401, message: "Missing permissions" });

    await db
      .updateTable("comments")
      .where("id", "=", Number(id))
      .set({ content: body.content })
      .execute();
  },
};

export const { GET, DELETE, PATCH, POST } = NextComment({
  adapter,
  async getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    return {
      id: session.user.email,
    };
  },
});
