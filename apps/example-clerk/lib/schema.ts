import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  userId: varchar("userId", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  canDelete: boolean("canDelete").notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey().notNull(),
  page: varchar("page", { length: 256 }).notNull(),
  thread: integer("thread"),
  author: varchar("author", { length: 256 }).notNull(),
  content: json("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rates = pgTable(
  "rates",
  {
    userId: varchar("userId", { length: 256 }).notNull(),
    commentId: integer("commentId").notNull(),
    like: boolean("like").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.commentId] }),
    index("comment_idx").on(table.commentId),
  ],
);
