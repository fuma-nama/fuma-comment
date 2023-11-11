import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/database";

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
