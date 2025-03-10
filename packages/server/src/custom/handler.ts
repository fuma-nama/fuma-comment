import type { CustomCommentRouter, CustomRequest, RouteHandler } from ".";

export function requestHandler<R extends CustomRequest>(
	server: CustomCommentRouter<R>,
	requestUrl: string,
	_method: string,
): [handler: RouteHandler<R>, params: Map<string, string>] | undefined {
	const method = _method.toUpperCase();
	const segments = requestUrl.split("/").filter((v) => v.length > 0);

	if (method === "GET") {
		if (segments.length === 1) {
			return [server["GET /comments/[page]"], new Map([["page", segments[0]]])];
		}

		if (segments.length === 2 && segments[1] === "auth") {
			return [
				server["GET /comments/[page]/auth"],
				new Map([["page", segments[0]]]),
			];
		}

		if (segments.length === 2 && segments[1] === "users") {
			return [
				server["GET /comments/[page]/users"],
				new Map([["page", segments[0]]]),
			];
		}
	}

	if (method === "PATCH") {
		if (segments.length === 2) {
			return [
				server["PATCH /comments/[page]/[id]"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}
	}

	if (method === "POST") {
		if (segments.length === 2) {
			return [
				server["POST /comments/[page]"],
				new Map([["page", segments[0]]]),
			];
		}

		if (segments.length === 3 && segments[2] === "rate") {
			return [
				server["POST /comments/[page]/[id]/rate"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}
	}

	if (method === "DELETE") {
		if (segments.length === 2) {
			return [
				server["DELETE /comments/[page]/[id]"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}

		if (segments.length === 3 && segments[2] === "rate") {
			return [
				server["DELETE /comments/[page]/[id]/rate"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}
	}
}
