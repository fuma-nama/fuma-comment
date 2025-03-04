import type { Content } from "@fuma-comment/server";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createAdapter } from "../src";
import { clear, init } from "./utils";

const db = new PrismaClient();

beforeAll(async () => {
	await db.$connect();
	await init();

	await db.comment.createMany({
		data: [
			{
				author: "mock_user",
				content: createContent("Hello World 1") as object,
				timestamp: new Date(Date.parse("3/12/2023")),
			},
			{
				author: "mock_user",
				content: createContent("Hello World 2") as object,
				timestamp: new Date(Date.parse("4/12/2023")),
			},
		],
	});

	await db.rate.createMany({
		data: [{ commentId: 1, like: true, userId: "mock_user" }],
	});
}, 20 * 1000);

afterAll(async () => {
	await clear(db);
}, 20 * 1000);

describe("Adapter", () => {
	const adapter = createAdapter({
		db,
		getUsers(users) {
			return users.map((user) => ({ id: user, name: "Mock User" }));
		},
	});

	test("Get Comments (Newest)", async () => {
		const rows = await adapter.getComments({ sort: "newest", limit: 10 });

		expect(rows, "Result sorted correctly").toEqual([
			expect.objectContaining({ id: 2 }),
			expect.objectContaining({ id: 1 }),
		]);
	});

	test("Get Comments (Newest, Auth)", async () => {
		const rows = await adapter.getComments({
			sort: "newest",
			limit: 10,
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
			limit: 10,
		});

		expect(rows, "Result sorted correctly").toEqual([
			expect.objectContaining({ id: 1 }),
			expect.objectContaining({ id: 2 }),
		]);
	});

	test("Get Comments (Oldest, Auth)", async () => {
		const rows = await adapter.getComments({
			sort: "oldest",
			limit: 10,
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
			page: "page",
		});
		const comments = await adapter.getComments({ sort: "oldest", limit: 10 });

		expect(comments.length, "New comment added").toBe(3);
	});

	test("Edit Comment", async () => {
		const newContent = createContent("Hello World");
		await adapter.updateComment({
			id: "3",
			auth: { id: "mock_user" },
			body: { content: newContent },
			page: "page",
		});
		const row = (await adapter.getComments({ sort: "oldest", limit: 10 })).find(
			(comment) => comment.id === "3",
		);

		expect(row?.content, "Content has updated").toStrictEqual(newContent);
	});

	test("Delete Comment", async () => {
		await adapter.deleteComment({
			id: "3",
			auth: { id: "mock_user" },
			page: "page",
		});
		const hasRemoved = (
			await adapter.getComments({ sort: "oldest", limit: 10 })
		).every((comment) => comment.id !== "3");

		expect(hasRemoved, "Comment should be removed").toBe(true);
	});

	test("Add Rate", async () => {
		const id = "2";
		await adapter.setRate({
			auth: { id: "mock_user" },
			body: { like: true },
			id,
			page: "page",
		});

		const comments = await adapter.getComments({
			sort: "oldest",
			auth: { id: "mock_user" },
			limit: 10,
		});

		const updated = comments.find((comment) => comment.id === id);
		expect(updated?.liked, "Has liked comment").toBe(true);
		expect(updated?.likes, "Likes count should be increased").toBe(1);
	});

	test("Remove Rate", async () => {
		const id = "2";
		await adapter.deleteRate({
			auth: { id: "mock_user" },
			id,
			page: "page",
		});

		const comments = await adapter.getComments({
			sort: "oldest",
			auth: { id: "mock_user" },
			limit: 10,
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
