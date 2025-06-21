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
	params: Map<string, string>,
): RequestType {
	const headers = new Map<string, readonly string[] | string>();
	req.headers.forEach((value, key) => {
		headers.set(key, value);
	});

	return {
		req,
		method: req.method,
		headers,
		body() {
			return req.json();
		},
		params,
		queryParams: req.nextUrl.searchParams,
	};
}

export function NextComment(options: NextCommentOptions): NextCommentRouter {
	const internal = CustomComment<RequestType>(options);
	const router: RouteHandler = async (req, context) => {
		const catchAll = ['comments', ...(await context.params).comment].join("/");
		const res = await internal.handleRequest(req.method, catchAll, (params) =>
			createRequest(req, params),
		);

		if (res) return createResponse(res);
		return NOT_FOUND;
	};

	return {
		GET: router,
		POST: router,
		PATCH: router,
		DELETE: router,
	};
}
