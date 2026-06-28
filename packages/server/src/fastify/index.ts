import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type {
	CustomCommentOptions,
	CustomRequest,
	CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

type RequestType = CustomRequest & {
	req: FastifyRequest;
};

export interface FastifyCommentOptions
	extends CustomCommentOptions<RequestType> {
	app: FastifyInstance;
	/**
	 * Base URL of API endpoints
	 */
	baseUrl?: string;
}

/**
 * Create comments API routes for Fastify
 */
export function FastifyComment(options: FastifyCommentOptions): void {
	const { app } = options;
	const methods = CustomComment<RequestType>(options).methods;

	for (const key of Object.keys(methods)) {
		const fn = methods[key as keyof typeof methods];
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

		app.route({
			method: method.toUpperCase() as "GET" | "POST" | "PATCH" | "DELETE",
			url: `/${pathWithBase}`,
			handler: async (req, reply) => {
				const result = await fn(readRequest(req));
				sendResponse(reply, result);
			},
		});
	}
}

export function commentPlugin(
	options: Omit<FastifyCommentOptions, "app">,
): FastifyPluginAsync {
	return async (app) => {
		FastifyComment({ ...options, app });
	};
}

function readRequest(req: FastifyRequest): RequestType {
	return {
		method: req.method,
		req,
		body: () => req.body,
		headers: new Map(Object.entries(req.headers)) as RequestType["headers"],
		params: {
			get(key) {
				return (req.params as Record<string, string | undefined>)[key];
			},
		},
		queryParams: {
			get(key) {
				const parsed = (
					req.query as Record<string, string | string[] | undefined>
				)[key];
				if (
					typeof parsed === "string" ||
					(Array.isArray(parsed) &&
						parsed.every((item) => typeof item === "string"))
				)
					return parsed;
			},
		},
	};
}

function sendResponse(reply: FastifyReply, result: CustomResponse): void {
	if (result.type === "success") {
		void reply.status(200).send(result.data);
	} else {
		void reply.status(result.status).send(result.data);
	}
}
