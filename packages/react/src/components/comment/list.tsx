import { type ComponentProps, type FC, useRef, useState } from "react";
import useSWRImmutable from "swr/immutable";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { getCommentsKey } from "../../utils/fetcher";
import { cn } from "../../utils/cn";
import { buttonVariants } from "../button";
import { syncComments } from "../../utils/comment-manager";
import { updateCommentList, useCommentList } from "../../utils/comment-list";
import { useCommentsContext } from "../../contexts/comments";
import { useCommentContext } from "../../contexts/comment";
import { Actions } from "./actions";
import { Comment } from "./index";
import { Spinner } from "../spinner";
import { useIsMobile } from "../../utils/use-media-query";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../dialog";
import type { SerializedComment } from "@fuma-comment/server";
import { ReplyForm } from "./reply-form";
import type { Editor } from "@tiptap/react";

const count = 40;

export interface CommentListProps extends ComponentProps<"div"> {
	threadId?: string;
	isSubThread?: boolean;
	components?: {
		Comment?: FC<{ comment: SerializedComment }>;
	};
}

const defaultComponents: Required<Required<CommentListProps>["components"]> = {
	Comment: ({ comment }) => (
		<Comment comment={comment} actions={<Actions canReply />}>
			<Replies />
		</Comment>
	),
};

export function CommentList({
	ref,
	threadId,
	isSubThread = false,
	components: _components = {},
	...props
}: CommentListProps) {
	const { page, fetcher } = useCommentsContext();
	const [cursor, setCursor] = useState<number>();
	const { Comment = defaultComponents.Comment } = useRef(_components).current;
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
		([_, options]) => fetcher.fetchComments(options),
		{
			onSuccess(data) {
				updateCommentList([page, threadId], (v = []) => [...v, ...data]);
				syncComments(data);
			},
		},
	);

	return (
		<div ref={ref} {...props} className={cn("flex flex-col", props.className)}>
			{!query.isLoading && cursor === undefined && list.length === 0 && (
				<p className="mx-auto my-4 text-center text-sm text-fc-muted-foreground">
					No comments
				</p>
			)}
			{list.map((reply) => (
				<Comment key={reply.id} comment={reply} />
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
			{query.isLoading ? <Spinner className="mx-auto my-4" /> : null}
		</div>
	);
}

export function Replies(): React.ReactNode {
	const { comment } = useCommentContext();
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const editorRef = useRef<Editor>(undefined);

	if (comment.replies === 0) return null;

	const button = (
		<button
			type="button"
			className={cn(
				buttonVariants({
					variant: "ghost",
					size: "medium",
					className:
						"w-full text-start justify-start gap-2 pl-13.5 bg-fc-card rounded-none",
				}),
			)}
		>
			<ChevronDown
				className={cn("size-4 transition-transform", open && "rotate-180")}
			/>
			{comment.replies} Replies
		</button>
	);

	if (isMobile) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{button}</DialogTrigger>
				<DialogContent className="h-[60vh]">
					<DialogTitle>Comments</DialogTitle>
					<CommentList
						threadId={comment.id}
						isSubThread
						className="flex-1 -mx-4 overflow-y-auto"
						components={{
							Comment: ({ comment }) => (
								<Comment comment={comment} actions={<Actions />} />
							),
						}}
					/>
					<ReplyForm
						comment={comment}
						editorRef={editorRef}
						className="sticky bottom-0 bg-fc-popover"
					/>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Collapsible className="bg-fc-card" open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>{button}</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-fc-accordion-up data-[state=open]:animate-fc-accordion-down">
				<CommentList
					threadId={comment.id}
					isSubThread
					components={{
						Comment: ({ comment }) => (
							<Comment
								comment={comment}
								actions={<Actions canReply />}
								className="ml-10"
							/>
						),
					}}
				/>
			</CollapsibleContent>
		</Collapsible>
	);
}
