import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Comment } from "server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/database";
import { authOptions } from "../auth/[...nextauth]/route";

const sortSchema = z.enum(["oldest", "newest"]).default("newest");
export async function GET(req: NextRequest): Promise<NextResponse<Comment[]>> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const threadId = req.nextUrl.searchParams.get("thread");
  const sort = sortSchema.parse(
    req.nextUrl.searchParams.get("sort") ?? undefined
  );

  let query = db
    .selectFrom("comments")
    .innerJoin("User", "User.email", "comments.author")
    .leftJoin("rates", "comments.id", "rates.commentId")
    .select(({ fn, selectFrom }) => {
      return [
        "comments.content",
        "comments.id",
        "comments.replyCommentId",
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
          .whereRef("replies.replyCommentId", "=", "comments.id")
          .as("replies"),
        selectFrom("rates")
          .select("rates.like")
          .where("rates.userId", "=", email ?? null)
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

  if (threadId) {
    query = query.where("comments.replyCommentId", "=", Number(threadId));
  } else {
    query = query.where("comments.replyCommentId", "is", null);
  }

  const comments = await query.execute();

  return NextResponse.json(
    comments.map((comment) => ({
      ...comment,
      replies: comment.replies ?? 0,
      liked: comment.liked ?? undefined,
      replyCommentId: comment.replyCommentId ?? undefined,
      author: {
        id: comment.authorId,
        name: comment.authorName ?? "Unknown",
        image: comment.authorImage ?? undefined,
      },
    }))
  );
}

const postSchema = z.strictObject({
  content: z.string().trim().min(1),
  thread: z.number().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const body = postSchema.parse(await req.json());
  const email = session?.user?.email;

  if (!email)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  await db
    .insertInto("comments")
    .values({
      author: email,
      content: body.content,
      replyCommentId: body.thread,
      timestamp: new Date(Date.now()),
    })
    .execute();

  return NextResponse.json({ message: "Done" });
}
