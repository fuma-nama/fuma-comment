import { useState } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import { createListener } from "./use-listener";
import { updateCommentList } from "./comment-list";

type Item = SerializedComment;

const map = new Map<number, Item>();

const { useListener, trigger } = createListener<[Item]>();

export function useCommentManager(id: number): Item | undefined {
  const [value, setValue] = useState(() => map.get(id));
  useListener(id, setValue);

  return value;
}

export function syncComments(comments: SerializedComment[]): void {
  comments.forEach((comment) => {
    setComment(comment.id, comment);
  });
}

function setComment(id: number, c: Item): void {
  map.set(id, c);
  trigger(id, c);
}

export function updateComment(
  commentId: number,
  updateFn: (comment: Item) => Item,
): void {
  const comment = map.get(commentId);

  if (!comment) return;
  setComment(commentId, updateFn(comment));
}

export function onCommentReplied(
  thread: number | undefined,
  comment: SerializedComment,
): void {
  if (thread) {
    updateCommentList([comment.page, thread], (v) => [...v, comment]);
    updateComment(thread, (c) => ({
      ...c,
      replies: c.replies + 1,
    }));
  }
}

export function onCommentDeleted(comment: SerializedComment): void {
  if (comment.threadId) {
    updateComment(comment.threadId, (c) => ({
      ...c,
      replies: c.replies - 1,
    }));
  }
}

export function onLikeUpdated(
  commentId: number,
  value: boolean | undefined,
): void {
  updateComment(commentId, (comment) => {
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
