import type { SerializedComment } from "@fuma-comment/server";
import { useState } from "react";
import { createListener } from "./use-listener";
import { useLatestCallback } from "./hooks";

type KeyArray = [page: string | undefined, threadId: number | undefined];
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
  update: (prev: SerializedComment[]) => SerializedComment[],
): void {
  const key = getKey(id);
  const list = data.get(key) ?? [];
  data.set(key, update(list));
  trigger(key);
}

function getKey(id: KeyArray): string {
  return `${id[0] ?? "unset"}:${id[1] ?? "unset"}`;
}
