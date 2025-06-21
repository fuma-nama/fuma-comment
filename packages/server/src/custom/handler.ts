import type { CustomCommentRouter, CustomRequest, RouteHandler } from ".";

export function requestHandler<R extends CustomRequest>(
	methods: CustomCommentRouter<R>,
	catchAll: string,
	_method: string,
): [handler: RouteHandler<R>, params: Map<string, string>] | undefined {
	const method = _method.toUpperCase();
	const segments = catchAll.split("/").filter((v) => v.length > 0);

	if (method === "GET") {
		if (segments.length === 1) {
			return [
				methods["GET /comments/[page]"],
				new Map([["page", segments[0]]]),
			];
		}

		if (segments.length === 2 && segments[1] === "auth") {
			return [
				methods["GET /comments/[page]/auth"],
				new Map([["page", segments[0]]]),
			];
		}

		if (segments.length === 2 && segments[1] === "users") {
			return [
				methods["GET /comments/[page]/users"],
				new Map([["page", segments[0]]]),
			];
		}
	}

	if (method === "PATCH") {
		if (segments.length === 2) {
			return [
				methods["PATCH /comments/[page]/[id]"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}
	}

	if (method === "POST") {
		if (segments.length === 1) {
			return [
				methods["POST /comments/[page]"],
				new Map([["page", segments[0]]]),
			];
		}

		if (segments.length === 3 && segments[2] === "rate") {
			return [
				methods["POST /comments/[page]/[id]/rate"],
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
				methods["DELETE /comments/[page]/[id]"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}

		if (segments.length === 3 && segments[2] === "rate") {
			return [
				methods["DELETE /comments/[page]/[id]/rate"],
				new Map([
					["page", segments[0]],
					["id", segments[1]],
				]),
			];
		}
	}
}
