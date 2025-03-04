import { forwardRef, type HTMLAttributes, useState } from "react";
import useSWRImmutable from "swr/immutable";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { fetchComments, getCommentsKey } from "../../utils/fetcher";
import { cn } from "../../utils/cn";
import { buttonVariants } from "../button";
import { Spinner } from "../spinner";
import { syncComments } from "../../utils/comment-manager";
import { updateCommentList, useCommentList } from "../../utils/comment-list";
import { useCommentsContext } from "../../contexts/comments";
import { useCommentContext } from "../../contexts/comment";
import { Actions } from "./actions";
import { Comment } from "./index";

const count = 40;

export interface CommentListProps extends HTMLAttributes<HTMLDivElement> {
	threadId?: string;
	isSubThread?: boolean;
}

export const CommentList = forwardRef<HTMLDivElement, CommentListProps>(
	({ threadId, isSubThread = false, ...props }, ref) => {
		const { page } = useCommentsContext();
		const [cursor, setCursor] = useState<number>();
		const list = useCommentList([page, threadId]);

		const query = useSWRImmutable(
			getCommentsKey({
				thread: threadId,
				page,
				sort: isSubThread ? "oldest" : "newest",
				[isSubThread ? "after" : "before"]:
					typeof cursor === "number" ? new Date(cursor) : undefined,
				limit: count,
			}),
			([_, options]) => fetchComments(options),
			{
				onSuccess(data) {
					updateCommentList([page, threadId], (v = []) => [...v, ...data]);
					syncComments(data);
				},
			},
		);

		return (
			<div
				ref={ref}
				{...props}
				className={cn("flex flex-col pb-2", props.className)}
			>
				{!query.isLoading &&
					typeof cursor === "undefined" &&
					list.length === 0 && (
						<p className="mx-auto my-4 text-center text-sm text-fc-muted-foreground">
							No comments
						</p>
					)}
				{list.map((reply) => (
					<Comment
						comment={reply}
						key={reply.id}
						actions={<Actions canReply={!isSubThread} />}
					>
						{!isSubThread ? <Replies /> : null}
					</Comment>
				))}
				{query.data && query.data.length >= count ? (
					<button
						type="button"
						className={cn(
							buttonVariants({
								variant: "secondary",
								size: "medium",
								className: "mx-auto my-2",
							}),
						)}
						onClick={() => {
							if (list.length > 0)
								setCursor(new Date(list[list.length - 1].timestamp).getTime());
						}}
					>
						Load More
					</button>
				) : null}
				{query.isLoading ? <Spinner className="mx-auto my-4 size-8" /> : null}
			</div>
		);
	},
);

CommentList.displayName = "CommentsList";

export function Replies(): React.ReactNode {
	const { comment } = useCommentContext();
	const [open, setOpen] = useState(false);

	if (comment.replies === 0) return null;

	return (
		<Collapsible
			className="border-y border-fc-border bg-fc-card pl-3"
			open={open}
			onOpenChange={setOpen}
		>
			<CollapsibleTrigger
				className={cn(
					buttonVariants({
						variant: "ghost",
						size: "medium",
						className: "gap-3.5",
					}),
				)}
			>
				<ChevronDown
					className={cn(
						"-ml-0.5 size-4 transition-transform",
						open && "rotate-180",
					)}
				/>
				{comment.replies} Replies
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-fc-accordion-up data-[state=open]:animate-fc-accordion-down">
				<CommentList threadId={comment.id} isSubThread />
			</CollapsibleContent>
		</Collapsible>
	);
}
