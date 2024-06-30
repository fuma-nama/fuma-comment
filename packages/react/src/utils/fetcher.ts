import type { SerializedComment } from "@fuma-comment/server";

export interface FetcherError {
  message: string;
}

export async function fetcher<T = void>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await response.text();
    let err: Error = new Error(message);

    try {
      const obj = JSON.parse(message) as object;

      if ("message" in obj && typeof obj.message === "string") {
        err = new Error(obj.message);
      }
    } catch (e) {
      /* empty */
    }

    throw err;
  }

  return (await response.json()) as T;
}

export function getCommentsKey(
  options: CommentOptions,
): [api: string, args: CommentOptions] {
  return ["/api/comments", options];
}

export interface CommentOptions {
  thread?: number;
  page?: string;
  limit?: number;

  /**
   * Fetch comments before a specific timestamp
   */
  before?: Date;

  /**
   * Fetch comments after a specific timestamp
   */
  after?: Date;
  sort?: "newest" | "oldest";
}

export function fetchComments({
  page,
  thread,
  sort,
  before,
  after,
  limit,
}: CommentOptions): Promise<SerializedComment[]> {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (thread) params.append("thread", thread.toString());
  if (sort) params.append("sort", sort);
  if (before) params.append("before", before.getTime().toString());
  if (limit) params.append("limit", limit.toString());
  if (after) params.append("after", after.getTime().toString());

  return fetcher(`/api/comments?${params.toString()}`);
}

export async function postComment({
  content,
  page,
  thread,
}: {
  content: object;
  thread?: number;
  page?: string;
}): Promise<SerializedComment> {
  return await fetcher("/api/comments", {
    method: "POST",
    body: JSON.stringify({
      thread,
      page,
      content,
    }),
  });
}

export async function editComment({
  id,
  content,
}: {
  id: number;
  content: object;
}): Promise<void> {
  await fetcher(`/api/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      content,
    }),
  });
}
