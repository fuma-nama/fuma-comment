import type {
  AuthInfoWithRole,
  SerializedComment,
  UserProfile,
} from "@fuma-comment/server";

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
  page: string;
  thread?: string;

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
  if (thread) params.append("thread", thread.toString());
  if (sort) params.append("sort", sort);
  if (before) params.append("before", before.getTime().toString());
  if (limit) params.append("limit", limit.toString());
  if (after) params.append("after", after.getTime().toString());

  return fetcher(`/api/comments/${page}/?${params.toString()}`);
}

export async function postComment({
  content,
  page,
  thread,
}: {
  content: object;
  thread?: string;
  page: string;
}): Promise<SerializedComment> {
  return await fetcher(`/api/comments/${page}`, {
    method: "POST",
    body: JSON.stringify({
      thread,
      content,
    }),
  });
}

export async function editComment({
  id,
  page,
  content,
}: {
  id: string;
  page: string;
  content: object;
}): Promise<void> {
  await fetcher(`/api/comments/${page}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      content,
    }),
  });
}

export async function deleteComment(options: {
  id: string;
  page: string;
}): Promise<void> {
  await fetcher(`/api/comments/${options.page}/${options.id}`, {
    method: "DELETE",
  });
}

export async function setRate(options: {
  id: string;
  page: string;
  like: boolean;
}): Promise<void> {
  await fetcher(`/api/comments/${options.page}/${options.id}/rate`, {
    method: "POST",
    body: JSON.stringify({ like: options.like }),
  });
}

export async function queryUsers(options: {
  name: string;
  page: string;
}): Promise<UserProfile[]> {
  const params = new URLSearchParams();
  params.append("name", options.name);

  return fetcher(`/api/comments/${options.page}/users?${params.toString()}`);
}

export async function deleteRate(options: {
  id: string;
  page: string;
}): Promise<void> {
  await fetcher(`/api/comments/${options.page}/${options.id}/rate`, {
    method: "DELETE",
  });
}

export async function getAuthSession(options: {
  page: string;
}): Promise<AuthInfoWithRole> {
  return await fetcher(`/api/comments/${options.page}/auth`, {
    method: "GET",
  });
}
