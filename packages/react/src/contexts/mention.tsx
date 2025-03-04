import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { MentionItem } from "../components/editor/mention";
import { queryUsers } from "../utils/fetcher";
import { useLatestCallback } from "../utils/hooks";

export type MentionOptions = Partial<Pick<MentionContextType, "query">> &
	Omit<MentionContextType, "query">;

export interface MentionContextType {
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

export function MentionProvider({
	mention,
	children,
}: {
	mention: MentionOptions;
	children: ReactNode;
}): ReactNode {
	const query = useLatestCallback<MentionContextType["query"]>(
		async (name, options) => {
			if (mention.query) void mention.query(name, options);

			const res = await queryUsers({ name, page: options.page });
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

export function useMention(): MentionContextType {
	return useContext(MentionContext);
}
