import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PostgresDialect, Kysely } from "kysely";
import { Pool } from "pg";
import type { Content } from "@fuma-comment/server";
import { createAdapter, type Database } from "../src";
import { down, up } from "../migrations/000-init";

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL env");

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

beforeAll(async () => {
  await up(db as Kysely<unknown>);

  await db
    .insertInto("comments")
    .values([
      {
        author: "mock_user",
        content: createContent("Hello World 1"),
        timestamp: new Date(Date.parse("3/12/2023")),
      },
      {
        author: "mock_user",
        content: createContent("Hello World 2"),
        timestamp: new Date(Date.parse("4/12/2023")),
      },
    ])
    .execute();

  await db
    .insertInto("rates")
    .values({ commentId: 1, like: true, userId: "mock_user" })
    .execute();
}, 20 * 1000);

afterAll(async () => {
  await down(db as Kysely<unknown>);
}, 20 * 1000);

describe("Adapter", () => {
  const adapter = createAdapter({
    db,
    joinUser(comments) {
      return comments.map((comment) => ({
        ...comment,
        author: { id: comment.authorId, name: "Mock User" },
      }));
    },
  });

  test("Get Comments (Newest)", async () => {
    const rows = await adapter.getComments({ sort: "newest" });

    expect(rows, "Result sorted correctly").toEqual([
      expect.objectContaining({ id: 2 }),
      expect.objectContaining({ id: 1 }),
    ]);
  });

  test("Get Comments (Newest, Auth)", async () => {
    const rows = await adapter.getComments({
      sort: "newest",
      auth: { id: "mock_user" },
    });

    expect(rows, "Result correct").toEqual([
      expect.objectContaining({ id: 2 }),
      expect.objectContaining({ id: 1, liked: true }),
    ]);
  });

  test("Get Comments (Oldest)", async () => {
    const rows = await adapter.getComments({
      sort: "oldest",
    });

    expect(rows, "Result sorted correctly").toEqual([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 }),
    ]);
  });

  test("Get Comments (Oldest, Auth)", async () => {
    const rows = await adapter.getComments({
      sort: "oldest",
      auth: { id: "mock_user" },
    });

    expect(rows, "Result correct").toEqual([
      expect.objectContaining({ id: 1, liked: true }),
      expect.objectContaining({ id: 2 }),
    ]);
  });

  test("Add Comment", async () => {
    await adapter.postComment({
      auth: { id: "mock_user" },
      body: { content: createContent("Hello World 3") },
    });
    const comments = await adapter.getComments({ sort: "oldest" });

    expect(comments.length, "New comment added").toBe(3);
  });

  test("Edit Comment", async () => {
    const newContent = createContent("Hello World");
    await adapter.updateComment({
      id: "3",
      auth: { id: "mock_user" },
      body: { content: newContent },
    });
    const row = (await adapter.getComments({ sort: "oldest" })).find(
      (comment) => comment.id === 3
    );

    expect(row?.content, "Content has updated").toStrictEqual(newContent);
  });

  test("Delete Comment", async () => {
    await adapter.deleteComment({
      id: "3",
      auth: { id: "mock_user" },
    });
    const hasRemoved = (await adapter.getComments({ sort: "oldest" })).every(
      (comment) => comment.id !== 3
    );

    expect(hasRemoved, "Comment should be removed").toBe(true);
  });

  test("Add Rate", async () => {
    const id = 2;
    await adapter.setRate({
      auth: { id: "mock_user" },
      body: { like: true },
      id: id.toString(),
    });

    const comments = await adapter.getComments({
      sort: "oldest",
      auth: { id: "mock_user" },
    });

    const updated = comments.find((comment) => comment.id === id);
    expect(updated?.liked, "Has liked comment").toBe(true);
    expect(updated?.likes, "Likes count should be increased").toBe(1);
  });

  test("Remove Rate", async () => {
    const id = 2;
    await adapter.deleteRate({
      auth: { id: "mock_user" },
      id: id.toString(),
    });

    const comments = await adapter.getComments({
      sort: "oldest",
      auth: { id: "mock_user" },
    });

    const updated = comments.find((comment) => comment.id === id);
    expect(updated?.liked, "Has no rate on comment").toBe(undefined);
    expect(updated?.likes, "Likes count should be decreased").toBe(0);
  });
});

function createContent(raw: string): Content {
  return {
    type: "docs",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: raw,
          },
        ],
      },
    ],
  };
}
