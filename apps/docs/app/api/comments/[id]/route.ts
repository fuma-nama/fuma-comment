import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { db } from "@/utils/database";
import { NOT_AUTHENTICATED } from "@/utils/errors";
import { authOptions } from "../../auth/[...nextauth]/route";

const patchSchema = z.strictObject({
  content: z.string().trim().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NOT_AUTHENTICATED;

  const { content } = patchSchema.parse(await req.json());

  const target = await db
    .selectFrom("comments")
    .select(["comments.author"])
    .where("id", "=", Number(params.id))
    .executeTakeFirst();

  if (!target || target.author !== session.user.email)
    return NextResponse.json(
      { message: "Missing permissions" },
      { status: 401 }
    );

  await db
    .updateTable("comments")
    .where("id", "=", Number(params.id))
    .set({ content })
    .execute();

  return NextResponse.json({ message: "Updated" });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NOT_AUTHENTICATED;

  const target = await db
    .selectFrom("comments")
    .select("author")
    .where("id", "=", Number(params.id))
    .executeTakeFirst();

  if (!target || target.author !== session.user.email)
    return NextResponse.json(
      { message: "Missing permissions" },
      { status: 401 }
    );

  await db
    .deleteFrom("comments")
    .where((eb) =>
      eb.or([
        eb("comments.id", "=", Number(params.id)),
        eb("comments.replyCommentId", "=", Number(params.id)),
      ])
    )
    .execute();

  return NextResponse.json({ message: "Done" });
}
