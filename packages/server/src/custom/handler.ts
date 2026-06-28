import { match, type MatchFunction } from "path-to-regexp";
import type { CustomCommentRouter, CustomRequest, RouteHandler } from ".";

function toPathPattern(pathname: string) {
	return pathname
		.split("/")
		.map((v) => (v.startsWith("[") && v.endsWith("]") ? `:${v.slice(1, -1)}` : v))
		.join("/");
}

export function convertToRequestHandler<R extends CustomRequest>(methods: CustomCommentRouter<R>) {
	let transformed: {
		match: MatchFunction<Record<string, string>>;
		method: string;
		handler: RouteHandler<R>;
	}[];

	return (_method: string, catchAll: string, createRequest: (params: Map<string, string>) => R) => {
		const method = _method.toUpperCase();

		transformed ??= Object.entries(methods).map(([key, value]) => {
			const [method, pathname] = key.split(" ", 2);

			return {
				match: match(toPathPattern(pathname)),
				method,
				handler: value,
			};
		});

		const virtualPathname = catchAll.length === 0 ? "/comments" : `/comments/${catchAll}`;

		for (const handler of transformed) {
			if (handler.method !== method) continue;
			const result = handler.match(virtualPathname);
			if (!result) continue;

			return handler.handler(createRequest(new Map(Object.entries(result.params))));
		}
	};
}
