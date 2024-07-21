import { createContext, useContext } from "react";

interface CommentsContext {
  page: string;
}

const CommentsContext = createContext<CommentsContext>({
  page: "",
});

export function useCommentsContext(): CommentsContext {
  return useContext(CommentsContext);
}

export const CommentsProvider = CommentsContext.Provider;
