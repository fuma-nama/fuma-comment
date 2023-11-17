import { useEffect, useState } from "react";
import type { SerializedComment } from "server";

type Listener = (update: SerializedComment) => void;
const map = new Map<number, SerializedComment>();
const listeners = new Map<number, Set<Listener>>();

export function useCommentManager(
  current: SerializedComment
): SerializedComment {
  const [value, setValue] = useState(map.get(current.id) ?? current);

  useEffect(() => {
    if (listeners.has(current.id)) {
      listeners.get(current.id)?.add(setValue);
    } else {
      listeners.set(current.id, new Set([setValue]));
    }

    return () => {
      listeners.get(current.id)?.delete(setValue);
    };
  }, [current.id]);

  return value;
}

export function syncComments(comments: SerializedComment[]): void {
  comments.forEach((comment) => {
    setComment(comment.id, comment);
  });
}

function setComment(id: number, c: SerializedComment): void {
  map.set(id, c);

  listeners.get(id)?.forEach((fn) => {
    fn(c);
  });
}

export function updateComment(
  commentId: number,
  updateFn: (comment: SerializedComment) => SerializedComment
): void {
  const comment = map.get(commentId);

  if (!comment) return;
  setComment(commentId, updateFn(comment));
}

export function onCommentPosted(thread: number | undefined): void {
  if (thread) {
    updateComment(thread, (c) => ({ ...c, replies: c.replies + 1 }));
  }
}

export function onCommentDeleted(comment: SerializedComment): void {
  if (comment.replyCommentId) {
    updateComment(comment.replyCommentId, (c) => ({
      ...c,
      replies: c.replies - 1,
    }));
  }
}

export function onLikeUpdated(
  commentId: number,
  value: boolean | undefined
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
