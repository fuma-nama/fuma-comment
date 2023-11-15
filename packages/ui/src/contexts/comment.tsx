import { createContext, useContext } from "react";
import type { SerializedComment } from "server";

export interface CommentContext {
  isEditing: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  setEdit: (v: boolean) => void;
  comment: SerializedComment;
}

const CommentContext = createContext<CommentContext | undefined>(undefined);

export function useCommentContext(): CommentContext {
  const ctx = useContext(CommentContext);

  if (!ctx) throw new Error("Missing Commend Context");
  return ctx;
}

export const CommentProvider = CommentContext.Provider;
