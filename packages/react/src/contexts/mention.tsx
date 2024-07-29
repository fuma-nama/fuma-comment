import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import { type MentionItem } from "../components/editor/mention";

export interface MentionContextType {
  enabled: boolean;

  /**
   * Auto-complete
   */
  query: (text: string) => MentionItem[];
}

export const MentionContext = createContext<MentionContextType>({
  enabled: false,
  query: () => [],
});

export function MentionProvider({
  mention,
  children,
}: {
  mention: MentionContextType;
  children: ReactNode;
}): React.ReactNode {
  const latestMention = useRef(mention);
  latestMention.current = mention;

  const value = useMemo<MentionContextType>(
    () => ({
      enabled: mention.enabled,
      query: (...args) => {
        return latestMention.current.query(...args);
      },
    }),
    [mention.enabled],
  );

  return (
    <MentionContext.Provider value={value}>{children}</MentionContext.Provider>
  );
}

export function useMention(): MentionContextType {
  return useContext(MentionContext);
}
