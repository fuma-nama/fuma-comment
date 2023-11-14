import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "kysely";

config({ path: resolve(".env.local") });

export async function init(): Promise<void> {
  const { db } = await import("../utils/database");

  await db.schema
    .createTable("comments")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("replyCommentId", "integer")
    .addColumn("author", "varchar(256)", (col) => col.notNull())
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("timestamp", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createTable("rates")
    .addColumn("userId", "varchar(256)")
    .addColumn("commentId", "integer")
    .addColumn("like", "boolean", (col) => col.notNull())
    .addPrimaryKeyConstraint("rates_pk", ["commentId", "userId"])
    .execute();
}
