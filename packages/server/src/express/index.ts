import type { Express, Request, Response } from "express";
import type {
	CustomCommentOptions,
	CustomRequest,
	CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

type RequestType = CustomRequest & {
	req: Request;
};

interface ExpressOptions extends CustomCommentOptions<RequestType> {
	app: Express;
	/**
	 * Base URL of API endpoints
	 */
	baseUrl?: string;
}

/**
 * Create comments API routes
 *
 * Should have `express.json()` body parser enabled
 */
export function ExpressComment(options: ExpressOptions): void {
	const { app } = options;
	const custom = CustomComment<RequestType>(options);

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
		headers: new Map(Object.entries(req.headers)) as RequestType["headers"],
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
