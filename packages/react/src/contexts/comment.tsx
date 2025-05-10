import { createContext, type RefObject, useContext } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import type { UseCommentEditor } from "../components/editor";

export interface CommentContext {
	isReplying: boolean;
	setReply: (v: boolean) => void;
	comment: SerializedComment;
	editorRef: RefObject<UseCommentEditor | undefined>;
}

const CommentContext = createContext<CommentContext | undefined>(undefined);

export function useCommentContext(): CommentContext {
	const ctx = useContext(CommentContext);

	if (!ctx) throw new Error("Missing Commend Context");
	return ctx;
}

export const CommentProvider = CommentContext.Provider;
