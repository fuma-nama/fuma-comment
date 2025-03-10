import Elysia, { type ElysiaConfig, error } from "elysia";
import {
	CustomComment,
	type CustomCommentOptions,
	type CustomRequest,
} from "../custom";
import { requestHandler } from "../custom/handler";

export interface CommentPluginOptions<Prefix extends string | undefined>
	extends CustomCommentOptions<CustomRequest> {
	elysia?: ElysiaConfig<Prefix>;
}

export function commentPlugin<Prefix extends string>(
	options: CommentPluginOptions<Prefix>,
) {
	const server = CustomComment(options);

	const app = new Elysia<Prefix>(options.elysia).all(
		"/*",
		async ({ request, body, query, params }) => {
			const res = requestHandler(
				server,
				(params as Record<string, string>)["*"],
				request.method,
			);

			if (res) {
				const [handler, params] = res;
				const headers = new Map<string, string | readonly string[]>();

				request.headers.forEach((value, key) => {
					headers.set(key, value);
				});

				const req: CustomRequest = {
					headers,
					body() {
						return body;
					},
					params,
					queryParams: new Map(Object.entries(query)),
				};

				return handler(req);
			}

			error(404, "Not Found");
		},
	);

	return app;
}
