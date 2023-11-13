import { createKysely } from "@vercel/postgres-kysely";
import { sql, type Generated } from "kysely";

interface CommentTable {
  id: Generated<number>;
  author: string;
  content: string;
  timestamp: Generated<Date>;
}

interface RateTable {
  userId: string;
  commentId: number;
  like: boolean;
}

interface Database {
  comments: CommentTable;
  rates: RateTable;
}

export const db = createKysely<Database>();

export async function init(): Promise<void> {
  await db.schema.dropTable("rates").ifExists().execute();
  await db.schema.dropTable("comments").ifExists().execute();

  await db.schema
    .createTable("comments")
    .addColumn("id", "serial", (col) => col.primaryKey())
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
