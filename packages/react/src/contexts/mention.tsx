import { createContext, type ReactNode, use, useMemo } from "react";
import type { MentionItem } from "../components/editor/mention";
import { useLatestCallback } from "../utils/hooks";
import { useCommentsContext } from "./comments";

type MentionOptions = Partial<Pick<MentionContextType, "query">> &
  Omit<MentionContextType, "query">;

interface MentionContextType {
  enabled: boolean;

  /**
   * Auto-complete queries.
   *
   * When not specified, fetch from API endpoints.
   */
  query: (
    text: string,
    options: { page: string },
  ) => MentionItem[] | Promise<MentionItem[]>;
}

const MentionContext = createContext<MentionContextType>({
  enabled: false,
  query: () => [],
});

function MentionProvider({
  mention,
  children,
}: {
  mention: MentionOptions;
  children: ReactNode;
}): ReactNode {
  const { fetcher } = useCommentsContext();
  const query = useLatestCallback<MentionContextType["query"]>(
    async (name, options) => {
      if (mention.query) void mention.query(name, options);

      const res = await fetcher.queryUsers({ name, page: options.page });
      return res.map((user) => ({ label: user.name, id: user.id }));
    },
  );

  const value = useMemo<MentionContextType>(
    () => ({
      enabled: mention.enabled,
      query,
    }),
    [mention.enabled, query],
  );

  return (
    <MentionContext.Provider value={value}>{children}</MentionContext.Provider>
  );
}

function useMention(): MentionContextType {
  return use(MentionContext);
}

export {
  MentionProvider,
  useMention,
  type MentionOptions,
  type MentionContextType,
};
