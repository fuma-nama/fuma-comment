import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createContent, mockAdapter } from "../../test/utils";
import { FastifyComment } from ".";

const app = Fastify();
const port = 4002;

FastifyComment({
	app,
	storage: mockAdapter,
	auth: {
		getSession: () => ({ id: "mock_user" }),
	},
});

function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(new URL(path, `http://127.0.0.1:${port.toString()}`), init);
}

describe("Fastify Server Routes", () => {
	beforeAll(async () => {
		await app.listen({ port, host: "127.0.0.1" });
	});

	afterAll(async () => {
		await app.close();
	});

	test("Get Comments", async () => {
		const result = await doFetch("/comments/page", { method: "GET" });

		expect(result.ok).toBe(true);
		expect(await result.json()).toStrictEqual([]);
	});

	test("Get Comments - Invalid", async () => {
		const result = await doFetch("/comments/page?sort=invalid", {
			method: "GET",
		});

		expect(result.ok).toBe(false);
	});

	test("Post Comments", async () => {
		const result = await doFetch("/comments/page", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: createContent("Hello World"),
			}),
		});

		expect(result.ok).toBe(true);
	});

	test("Post Comments - Invalid", async () => {
		const result = await doFetch("/comments/page", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: createContent(""),
			}),
		});

		expect(result.ok).toBe(false);
	});

	test("Update Comment", async () => {
		const result = await doFetch("/comments/page/test", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: createContent("Hello World"),
			}),
		});

		expect(result.ok).toBe(true);
	});

	test("Update Comment - Invalid", async () => {
		const result = await doFetch("/comments/page/test", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: createContent(""),
			}),
		});

		expect(result.ok).toBe(false);
	});

	test("Delete Comment", async () => {
		const result = await doFetch("/comments/page/test", {
			method: "DELETE",
		});

		expect(result.ok).toBe(true);
	});

	test("Set Rate", async () => {
		const result = await doFetch("/comments/page/test/rate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				like: true,
			}),
		});

		expect(result.ok).toBe(true);
	});

	test("Set Rate - Invalid", async () => {
		const result = await doFetch("/comments/page/test/rate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				like: null,
			}),
		});

		expect(result.ok).toBe(false);
	});

	test("Delete Rate", async () => {
		const result = await doFetch("/comments/page/test/rate", {
			method: "DELETE",
		});

		expect(result.ok).toBe(true);
	});
});
