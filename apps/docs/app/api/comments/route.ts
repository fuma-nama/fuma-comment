import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/utils/database";

export async function GET(): Promise<NextResponse> {
  const comments = await db.selectFrom("comments").selectAll().execute();

  return NextResponse.json(comments);
}

const postSchema = z.strictObject({
  content: z.string().trim().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = postSchema.parse(await req.json());
  await db
    .insertInto("comments")
    .values({ author: "Fuma", content: body.content })
    .execute();

  return NextResponse.json({ message: "Done" });
}
