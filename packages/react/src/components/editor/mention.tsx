import type { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useState } from "react";
import useSWR from "swr";
import { useCommentsContext } from "../../contexts/comments";
import { useMention } from "../../contexts/mention";
import { cn } from "../../utils/cn";
import { Spinner } from "../spinner";

export interface MentionListRef {
	onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface MentionItem {
	id: string;
	label: string;
}

export const MentionList = forwardRef<
	MentionListRef,
	SuggestionProps<MentionItem, { id: string; label: string }>
>((props, ref) => {
	const { page } = useCommentsContext();
	const ctx = useMention();

	const [selectedIndex, setSelectedIndex] = useState(0);
	const query = useSWR(
		["/api/comments/users", page, props.query],
		() => ctx.query(props.query, { page }),
		{
			keepPreviousData: true,
			onSuccess() {
				setSelectedIndex(0);
			},
		},
	);

	const selectItem = (index: number): void => {
		const item = query.data?.at(index);

		if (item) {
			props.command({ id: item.id, label: item.label });
		}
	};

	useImperativeHandle(ref, () => ({
		onKeyDown: (event) => {
			const items = query.data;
			if (event.key === "ArrowUp" && items) {
				setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
				return true;
			}

			if (event.key === "ArrowDown" && items) {
				setSelectedIndex((prev) => (prev + 1) % items.length);
				return true;
			}

			if (event.key === "Enter") {
				selectItem(selectedIndex);
				return true;
			}

			return false;
		},
	}));

	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg">
			{query.data?.map((item, index) => (
				<button
					type="button"
					className={cn(
						"px-3 py-1.5 text-left font-medium",
						index === selectedIndex &&
							"bg-fc-primary text-fc-primary-foreground",
					)}
					key={item.id}
					onClick={() => {
						selectItem(index);
					}}
				>
					{item.label}
				</button>
			))}
			{query.data?.length === 0 && (
				<p className="p-3 text-fc-muted-foreground">No result</p>
			)}
			{!query.data ? (
				<div className="flex flex-row items-center gap-1.5 p-3 text-fc-muted-foreground">
					<Spinner className="size-4" />
					Loading
				</div>
			) : null}
		</div>
	);
});

MentionList.displayName = "MentionList";
