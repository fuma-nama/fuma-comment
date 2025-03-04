import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	type AuthInfo,
	type AuthInfoWithRole,
	type Awaitable,
} from "@fuma-comment/server";
import type {
	CustomCommentOptions,
	CustomRequest,
	CustomResponse,
} from "@fuma-comment/server/custom";
import { CustomComment } from "@fuma-comment/server/custom";

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

export interface NextCommentOptions
	extends Omit<
		CustomCommentOptions<RequestType>,
		"getSession" | "getSessionWithRole"
	> {
	getSession: (req: NextRequest) => Awaitable<AuthInfo | null>;
	getSessionWithRole?: (
		req: NextRequest,
		options: { page: string },
	) => Awaitable<AuthInfoWithRole | null>;
}

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
	return {
		req,
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
	const { getSession, getSessionWithRole } = options;
	const internal = CustomComment<RequestType>({
		...options,
		getSession: (req) => getSession(req.req),
		getSessionWithRole: getSessionWithRole
			? (req, v) => getSessionWithRole(req.req, v)
			: undefined,
	});

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
