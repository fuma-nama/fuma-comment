import type { SerializedComment } from "@fuma-comment/server";
import { createContext, type RefObject, useContext } from "react";
import type { UseCommentEditor } from "../components/editor";

interface CommentContext {
  isReplying: boolean;
  setReply: (v: boolean) => void;
  comment: SerializedComment;
  editorRef: RefObject<UseCommentEditor | undefined>;
}

const CommentContext = createContext<CommentContext | undefined>(undefined);

function useCommentContext(): CommentContext {
  const ctx = useContext(CommentContext);

  if (!ctx) throw new Error("Missing Commend Context");
  return ctx;
}

const CommentProvider = CommentContext.Provider;

export { CommentProvider, useCommentContext, type CommentContext };
