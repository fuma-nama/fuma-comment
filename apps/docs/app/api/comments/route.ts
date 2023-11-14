import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Comment } from "server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/database";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(): Promise<NextResponse<Comment[]>> {
  const comments = await db
    .selectFrom("comments")
    .innerJoin("User", "User.email", "comments.author")
    .leftJoin("rates", "comments.id", "rates.commentId")
    .select(({ fn }) => {
      return [
        "comments.content",
        "comments.id",
        "comments.replyCommentId",
        "comments.timestamp",
        "User.name as authorName",
        "User.image as authorImage",
        "User.id as authorId",
        fn
          .count<number>("rates.commentId")
          .filterWhere("rates.like", "=", true)
          .as("likes"),
        fn
          .count<number>("rates.commentId")
          .filterWhere("rates.like", "=", false)
          .as("dislikes"),
      ];
    })
    .orderBy("timestamp desc")
    .groupBy(["comments.id", "User.id"])
    .execute();

  return NextResponse.json(
    comments.map((comment) => ({
      ...comment,
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
