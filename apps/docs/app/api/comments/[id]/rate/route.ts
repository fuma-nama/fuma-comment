import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/utils/database";

const postSchema = z.strictObject({
  like: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const body = postSchema.parse(await req.json());

  await db
    .insertInto("rates")
    .onDuplicateKeyUpdate({ like: body.like })
    .values({ commentId: Number(params.id), userId: "Fuma", like: body.like })
    .execute();

  return NextResponse.json({ message: "Successful" });
}

export async function DELETE(
  _,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  await db
    .deleteFrom("rates")
    .where("rates.commentId", "=", Number(params.id))
    .where("rates.userId", "=", "Fuma")
    .execute();

  return NextResponse.json({ message: "Successful" });
}
