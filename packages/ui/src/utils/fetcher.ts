import type { SerializedComment } from "server";
import type { ScopedMutator } from "swr/_internal";

export async function fetcher<T = void>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(await response.text());

  return (await response.json()) as T;
}

export function updateComment(
  mutate: ScopedMutator,
  commentId: number,
  updateFn: (comment: SerializedComment) => SerializedComment
): void {
  void mutate<SerializedComment[]>(
    "/api/comments",
    (prev) =>
      prev?.map((item) => {
        if (item.id === commentId) return updateFn(item);
        return item;
      }),
    {
      revalidate: false,
    }
  );
}

export function updateLikes(
  mutate: ScopedMutator,
  commentId: number,
  value: boolean | undefined
): void {
  updateComment(mutate, commentId, (comment) => {
    let likes: number = comment.likes;
    let dislikes: number = comment.dislikes;

    if (comment.liked === true) likes--;
    if (comment.liked === false) dislikes--;
    if (value === true) likes++;
    if (value === false) dislikes++;

    return {
      ...comment,
      likes,
      dislikes,
      liked: value,
    };
  });
}
