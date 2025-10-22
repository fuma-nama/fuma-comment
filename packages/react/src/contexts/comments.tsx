import { createContext, use } from "react";
import type { Fetcher } from "../utils/fetcher";

interface CommentsContext {
  page: string;
  fetcher: Fetcher;
}

const CommentsContext = createContext<CommentsContext | null>(null);

function useCommentsContext(): CommentsContext {
  const context = use(CommentsContext);

  if (!context) {
    throw new Error(
      "useCommentsContext must be used within a CommentsProvider",
    );
  }

  return context;
}

const CommentsProvider = CommentsContext.Provider;

export { CommentsProvider, useCommentsContext, type CommentsContext };
