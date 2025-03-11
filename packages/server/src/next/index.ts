import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
	CustomCommentOptions,
	CustomRequest,
	CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

type RouteHandler = (
	req: NextRequest,
	context: {
		params: Promise<{
			comment: string[];
		}>;
	},
) => Promise<NextResponse>;

interface NextCommentRouter {
	GET: RouteHandler;
	POST: RouteHandler;
	PATCH: RouteHandler;
	DELETE: RouteHandler;
}

interface RequestType extends CustomRequest {
	req: NextRequest;
}

export type NextCommentOptions = CustomCommentOptions<RequestType>;

const NOT_FOUND = NextResponse.json({ message: "Not Found" }, { status: 404 });

function createResponse(result: CustomResponse): NextResponse {
	if (result.type === "success") {
		return NextResponse.json(result.data);
	}

	return NextResponse.json(result.data, { status: result.status });
}

function createRequest(
	req: NextRequest,
	params: Record<string, string>,
): RequestType {
	const headers = new Map<string, readonly string[] | string>();
	req.headers.forEach((value, key) => {
		headers.set(key, value);
	});

	return {
		req,
		headers,
		body() {
			return req.json();
		},
		params: {
			get(key) {
				return params[key];
			},
		},
		queryParams: req.nextUrl.searchParams,
	};
}

export function NextComment(options: NextCommentOptions): NextCommentRouter {
	const internal = CustomComment<RequestType>(options);

	return {
		GET: async (req, context) => {
			const params = (await context.params).comment;

			// GET /[page]
			if (params.length === 1) {
				const result = await internal["GET /comments/[page]"](
					createRequest(req, {
						page: params[0],
					}),
				);

				return createResponse(result);
			}

			// GET /[page]/auth
			if (params.length === 2 && params[1] === "auth") {
				const result = await internal["GET /comments/[page]/auth"](
					createRequest(req, {
						page: params[0],
					}),
				);

				return createResponse(result);
			}

			// GET /[page]/users
			if (params.length === 2 && params[1] === "users") {
				const result = await internal["GET /comments/[page]/users"](
					createRequest(req, {
						page: params[0],
					}),
				);

				return createResponse(result);
			}

			return NOT_FOUND;
		},
		POST: async (req, context) => {
			const params = (await context.params).comment;

			// POST /[page]
			if (params.length === 1) {
				const result = await internal["POST /comments/[page]"](
					createRequest(req, { page: params[0] }),
				);

				return createResponse(result);
			}

			// POST /[page]/[id]/rate
			if (params.length === 3 && params[2] === "rate") {
				const result = await internal["POST /comments/[page]/[id]/rate"](
					createRequest(req, {
						page: params[0],
						id: params[1],
					}),
				);

				return createResponse(result);
			}

			return NOT_FOUND;
		},
		PATCH: async (req, context) => {
			const params = (await context.params).comment;

			// PATCH /[page]/[id]
			if (params.length === 2) {
				const result = await internal["PATCH /comments/[page]/[id]"](
					createRequest(req, {
						page: params[0],
						id: params[1],
					}),
				);

				return createResponse(result);
			}

			return NOT_FOUND;
		},
		DELETE: async (req, context) => {
			const params = (await context.params).comment;

			// DELETE /[page]/[id]
			if (params.length === 2) {
				const result = await internal["DELETE /comments/[page]/[id]"](
					createRequest(req, { page: params[0], id: params[1] }),
				);

				return createResponse(result);
			}

			// DELETE /[page]/[id]/rate
			if (params.length === 3 && params[2] === "rate") {
				const result = await internal["DELETE /comments/[page]/[id]/rate"](
					createRequest(req, { page: params[0], id: params[1] }),
				);

				return createResponse(result);
			}

			return NOT_FOUND;
		},
	};
}
