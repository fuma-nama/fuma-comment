import type { Express, Request, Response } from "express";
import type { AuthInfo, AuthInfoWithRole, Awaitable } from "../types";
import type {
	CustomCommentOptions,
	CustomRequest,
	CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

type RequestType = CustomRequest & {
	req: Request;
};

interface ExpressOptions
	extends Omit<
		CustomCommentOptions<RequestType>,
		"getSession" | "getSessionWithRole"
	> {
	app: Express;
	/**
	 * Base URL of API endpoints
	 */
	baseUrl?: string;

	/** Get user session */
	getSession: (request: Request) => Awaitable<AuthInfo | null>;

	/** Get user session with role information */
	getSessionWithRole?: (
		request: Request,
		options: {
			page: string;
		},
	) => Awaitable<AuthInfoWithRole | null>;
}

/**
 * Create comments API routes
 *
 * Should have `express.json()` body parser enabled
 */
export function ExpressComment(options: ExpressOptions): void {
	const { app, getSession, getSessionWithRole } = options;
	const custom = CustomComment<RequestType>({
		...options,
		getSessionWithRole: getSessionWithRole
			? (req, v) => getSessionWithRole(req.req, v)
			: undefined,
		getSession: (req) => getSession(req.req),
	});

	for (const key of Object.keys(custom)) {
		const fn = custom[key as keyof typeof custom];
		const [method, path] = key.split(" ");

		const pathWithBase = [
			...(options.baseUrl ?? "").split("/"),
			...path.split("/"),
		]
			.filter((v) => v.length > 0)
			.map((v) =>
				v.startsWith("[") && v.endsWith("]") ? `:${v.slice(1, -1)}` : v,
			)
			.join("/");

		app[method.toLowerCase() as "get" | "post" | "patch" | "delete"](
			`/${pathWithBase}`,
			(req, res) => {
				void fn(readRequest(req))
					.then((result) => {
						sendResponse(res, result);
					})
					.catch((e: unknown) => {
						throw e;
					});
			},
		);
	}
}

function readRequest(req: Request): RequestType {
	return {
		req,
		body: () => req.body as unknown,
		params: {
			get(key) {
				return req.params[key];
			},
		},
		queryParams: {
			get(key) {
				return req.query[key] as string;
			},
		},
	};
}

function sendResponse(res: Response, result: CustomResponse): void {
	if (result.type === "success") {
		res.status(200).json(result.data);
	} else {
		res.status(result.status).json(result.data);
	}
}
