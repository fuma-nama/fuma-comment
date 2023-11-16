import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { db } from "@/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NOT_AUTHENTICATED } from "@/utils/errors";

const postSchema = z.strictObject({
  like: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NOT_AUTHENTICATED;
  const body = postSchema.parse(await req.json());

  await db
    .insertInto("rates")
    .values({
      commentId: Number(params.id),
      userId: session.user.email,
      like: body.like,
    })
    .onConflict((c) =>
      c.columns(["userId", "commentId"]).doUpdateSet({ like: body.like })
    )
    .execute();

  return NextResponse.json({ message: "Successful" });
}

export async function DELETE(
  _,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NOT_AUTHENTICATED;
  await db
    .deleteFrom("rates")
    .where("rates.commentId", "=", Number(params.id))
    .where("rates.userId", "=", session.user.email)
    .execute();

  return NextResponse.json({ message: "Successful" });
}
