import type { CustomCommentRouter, CustomRequest, RouteHandler } from ".";

export function convertToRequestHandler<R extends CustomRequest>(
	methods: CustomCommentRouter<R>,
) {
	let transformed: {
		pattern: URLPattern;
		method: string;
		handler: RouteHandler<R>;
	}[];

	return async (
		_method: string,
		catchAll: string,
		createRequest: (params: Map<string, string>) => R,
	) => {
		const method = _method.toUpperCase();

		// @ts-ignore: Property 'UrlPattern' does not exist
		if (!globalThis.URLPattern) {
			await import("urlpattern-polyfill");
		}

		transformed ??= Object.entries(methods).map(([key, value]) => {
			const [method, pathname] = key.split(" ", 2);

			return {
				pattern: new URLPattern({
					pathname: pathname
						.split("/")
						.map((v) =>
							v.startsWith("[") && v.endsWith("]") ? `:${v.slice(1, -1)}` : v,
						)
						.join("/"),
				}),
				method,
				handler: value,
			};
		});

		const virtualPathname =
			catchAll.length === 0 ? "/comments" : `/comments/${catchAll}`;

		for (const handler of transformed) {
			if (handler.method !== method) continue;
			const match = handler.pattern.exec({ pathname: virtualPathname });
			if (!match) continue;

			return handler.handler(
				createRequest(
					new Map(
						Object.entries(match.pathname.groups as Record<string, string>),
					),
				),
			);
		}
	};
}
