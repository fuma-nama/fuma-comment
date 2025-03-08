import { describe, expect, test } from "vitest";
import type { StorageAdapter } from "../adapter";
import { createContent } from "../../test/utils";
import type { CustomRequest } from ".";
import { CustomComment } from ".";

type MockRequest = CustomRequest & {
	auth?: boolean;
};

const mockAdapter: StorageAdapter = {
	deleteComment() {
		// does nothing
	},
	deleteRate() {
		// does nothing
	},
	getComments() {
		return [];
	},
	postComment() {
		// does nothing
		return {
			id: "xx",
			timestamp: new Date(Date.now()),
			author: {
				id: "xxx",
				name: "hello",
			},
			likes: 0,
			dislikes: 0,
			page: "default",
			content: {},
			replies: 0,
		};
	},
	setRate() {
		// does nothing
	},
	updateComment() {
		// does nothing
	},
	getRole() {
		return null;
	},
	getCommentAuthor() {
		return "mock_user";
	},
};

const app = CustomComment<MockRequest>({
	storage: mockAdapter,
	auth: {
		getSession(req) {
			if (req.auth) return { id: "mock_user" };
			return null;
		},
	},
});

function createReq(options: {
	auth?: boolean;
	headers?: Record<string, string>;
	params?: Record<string, string>;
	queryParams?: Record<string, string>;
	body?: MockRequest["body"];
}): MockRequest {
	return {
		auth: options.auth ?? false,
		body: options.body ?? (() => null),
		params: new Map(Object.entries(options.params ?? {})),
		queryParams: new Map(Object.entries(options.queryParams ?? {})),
		headers: new Map(Object.entries(options.headers ?? {})),
	};
}

describe("Custom Comment Routes", () => {
	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				body() {
					return null;
				},
				params: {
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "With Auth",
			req: createReq({
				auth: true,
				body() {
					return null;
				},
				params: {
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Invalid",
			req: createReq({
				auth: false,
				body() {
					return null;
				},
				queryParams: {
					sort: "invalid_value",
				},
			}),
			success: false,
		},
	])("Get Comments $name", async ({ req, success }) => {
		const result = await app["GET /comments/[page]"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});

	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				auth: true,
				body() {
					return { content: createContent("Hello World") };
				},
				params: {
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Invalid",
			req: createReq({
				auth: true,
				body() {
					return { content: createContent(" ") };
				},
				params: {
					page: "default",
				},
			}),
			success: false,
		},
		{
			name: "Unauthorized",
			req: createReq({
				auth: false,
				body() {
					return { content: createContent("Hello World") };
				},
				params: {
					page: "default",
				},
			}),
			success: false,
		},
	])("Post Comments $name", async ({ req, success }) => {
		const result = await app["POST /comments/[page]"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});

	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				auth: true,
				body() {
					return { content: createContent("Hello World") };
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Invalid",
			req: createReq({
				auth: true,
				body() {
					return { content: createContent(" ") };
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
		{
			name: "Unauthorized",
			req: createReq({
				auth: false,
				body() {
					return { content: createContent("Hello World") };
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
	])("Update Comments $name", async ({ req, success }) => {
		const result = await app["PATCH /comments/[page]/[id]"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});

	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				auth: true,
				body() {
					return null;
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Unauthorized",
			req: createReq({
				auth: false,
				body() {
					return null;
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
	])("Delete Comments $name", async ({ req, success }) => {
		const result = await app["DELETE /comments/[page]/[id]"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});

	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				auth: true,
				body() {
					return { like: true };
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Invalid",
			req: createReq({
				body() {
					return { like: "invalid" };
				},
				auth: true,
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
		{
			name: "Unauthorized",
			req: createReq({
				auth: false,
				body() {
					return null;
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
	])("POST /api/comments/[id]/rate $name", async ({ req, success }) => {
		const result = await app["POST /comments/[page]/[id]/rate"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});

	test.each<{ name: string; req: MockRequest; success: boolean }>([
		{
			name: "Normal",
			req: createReq({
				auth: true,
				body() {
					return null;
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: true,
		},
		{
			name: "Unauthorized",
			req: createReq({
				auth: false,
				body() {
					return null;
				},
				params: {
					id: "test",
					page: "default",
				},
			}),
			success: false,
		},
	])("DELETE /api/comments/[id]/rate $name", async ({ req, success }) => {
		const result = await app["DELETE /comments/[page]/[id]/rate"](req);

		expect(result.type).toBe(success ? "success" : "error");
	});
});
