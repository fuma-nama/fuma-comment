import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Comment } from "server";
import { getServerSession } from "next-auth";
import { sql } from "kysely";
import { db } from "@/utils/database";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(): Promise<NextResponse<Comment[]>> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const comments = await db
    .selectFrom("comments")
    .innerJoin("User", "User.email", "comments.author")
    .leftJoin("rates as likes", (join) =>
      join
        .onRef("comments.id", "=", "likes.commentId")
        .on("likes.like", "=", true)
    )
    .leftJoin("rates as dislikes", (join) =>
      join
        .onRef("comments.id", "=", "dislikes.commentId")
        .on("dislikes.like", "=", false)
    )
    .leftJoin("rates as self_rate", (c) => {
      const join = c.onRef("comments.id", "=", "self_rate.commentId");

      if (email) return join.on("self_rate.userId", "=", email);

      return join.on(sql`false`);
    })
    .select(({ fn }) => {
      return [
        "comments.content",
        "comments.id",
        "comments.replyCommentId",
        "comments.timestamp",
        "User.name as authorName",
        "User.image as authorImage",
        "User.email as authorId",
        fn.count<number>("likes.like").as("likes"),
        fn.count<number>("dislikes.like").as("dislikes"),
        "self_rate.like as liked",
      ];
    })
    .orderBy("timestamp desc")
    .groupBy([
      "comments.id",
      "User.id",
      "self_rate.commentId",
      "self_rate.userId",
    ])
    .execute();

  return NextResponse.json(
    comments.map((comment) => ({
      ...comment,
      liked: comment.liked ?? undefined,
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
      timestamp: new Date(Date.now()),
    })
    .execute();

  return NextResponse.json({ message: "Done" });
}
