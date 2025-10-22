import { createContext, useContext } from "react";
import type { Fetcher } from "../utils/fetcher";

interface CommentsContext {
  page: string;
  fetcher: Fetcher;
}

const CommentsContext = createContext<CommentsContext | null>(null);

export function useCommentsContext(): CommentsContext {
  const context = useContext(CommentsContext);

  if (!context) {
    throw new Error(
      "useCommentsContext must be used within a CommentsProvider",
    );
  }

  return context;
}

export const CommentsProvider = CommentsContext.Provider;
