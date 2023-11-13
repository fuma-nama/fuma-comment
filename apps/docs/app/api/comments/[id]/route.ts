import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/utils/database";

const patchSchema = z.strictObject({
  content: z.string().trim().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { content } = patchSchema.parse(await req.json());

  const target = await db
    .selectFrom("comments")
    .where("id", "=", Number(params.id))
    .executeTakeFirst();

  if (!target)
    return NextResponse.json({ message: "Not Found" }, { status: 404 });

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
  const target = await db
    .selectFrom("comments")
    .where("id", "=", Number(params.id))
    .executeTakeFirst();

  if (!target)
    return NextResponse.json({ message: "Not Found" }, { status: 404 });

  // TODO: Implement authentication
  await db.deleteFrom("comments").where("id", "=", Number(params.id)).execute();

  return NextResponse.json({ message: "Done" });
}
