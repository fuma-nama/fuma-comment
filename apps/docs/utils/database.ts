import { createKysely } from "@vercel/postgres-kysely";
import { sql, type Generated } from "kysely";

interface CommentTable {
  id: Generated<number>;
  author: string;
  content: string;
  timestamp: Generated<Date>;
}

interface Database {
  comments: CommentTable;
}

export const db = createKysely<Database>();

export async function init(): Promise<void> {
  await db.schema.dropTable("comments").ifExists().execute();

  await db.schema
    .createTable("comments")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("author", "varchar(256)")
    .addColumn("content", "text")
    .addColumn("timestamp", "timestamp", (col) => col.defaultTo(sql`now()`))
    .execute();
}
