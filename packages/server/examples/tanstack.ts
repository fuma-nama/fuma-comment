import { createServerRoute } from "@tanstack/react-start/server";
import type { CustomCommentOptions, CustomRequest } from "../src/custom";
import { CustomComment } from "../src/custom";
import { mockAdapter } from "../test/utils";

// Define the request type for Tanstack Start
export type TanstackRequest = CustomRequest & {
	// Optionally, you can add Tanstack-specific context here if needed
};

export type TanstackCommentOptions = CustomCommentOptions<TanstackRequest>;

const comment = CustomComment<TanstackRequest>({
	storage: mockAdapter,
	auth: {
		getSession() {
			return null;
		},
	},
});

async function endpoint({
	request,
	params,
}: {
	request: Request;
	params: Record<string, string>;
}) {
	const res = await comment.handleRequest(
		request.method,
		params._splat,
		(params) => {
			const headers = new Map();

			request.headers.forEach((value, key) => {
				headers.set(key, value);
			});

			return {
				method: request.method,
				body() {
					return request.json();
				},
				headers,
				params,
				queryParams: new URL(request.url).searchParams,
			};
		},
	);

	if (!res) {
		return new Response("Not Found", {
			status: 404,
		});
	}

	if (res.type === "success") {
		return Response.json(res.data);
	}

	return Response.json(res.data, { status: res.status });
}

export const ServerRoute = createServerRoute("/api/comments/$").methods({
	GET: endpoint,
	DELETE: endpoint,
	POST: endpoint,
	PATCH: endpoint,
	PUT: endpoint,
});
