import type { SerializedComment } from "@fuma-comment/server";
import { useState } from "react";
import { useLatestCallback } from "./hooks";
import { createListener } from "./use-listener";

type KeyArray = [page: string, threadId: string | undefined];
const data = new Map<string, SerializedComment[]>();
const { useListener, trigger } = createListener<[]>();

export function useCommentList(id: KeyArray): SerializedComment[] {
	const key = getKey(id);
	const [list, setList] = useState(() => data.get(key) ?? []);

	useListener(
		key,
		useLatestCallback(() => {
			setList(data.get(key) ?? []);
		}),
	);

	return list;
}

export function updateCommentList(
	id: KeyArray,
	update: (
		prev: SerializedComment[] | undefined,
	) => SerializedComment[] | undefined,
): void {
	const key = getKey(id);
	const list = data.get(key);
	const updated = update(list);

	if (updated) {
		data.set(key, updated);
		trigger(key);
	}
}

function getKey(id: KeyArray): string {
	return `${id[0]}:${id[1] ?? "unset"}`;
}
