import type { SerializedComment } from "@fuma-comment/server";
import { cva } from "class-variance-authority";
import { ReplyIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuthContext } from "../../contexts/auth";
import { useCommentContext } from "../../contexts/comment";
import { useCommentsContext } from "../../contexts/comments";
import { cn } from "../../utils/cn";
import { onLikeUpdated } from "../../utils/comment-manager";
import { useIsMobile } from "../../utils/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import type { UseCommentEditor } from "../editor";
import { ReplyForm } from "./reply-form";

const rateVariants = cva(
	"inline-flex items-center gap-1.5 p-2 text-xs transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fc-ring",
	{
		variants: {
			active: {
				true: "bg-fc-accent text-fc-accent-foreground",
				false: "text-fc-muted-foreground hover:text-fc-accent-foreground",
			},
		},
	},
);

export function Actions({
	canReply = false,
}: {
	canReply?: boolean;
}): React.ReactNode {
	const { fetcher } = useCommentsContext();
	const { comment, isReplying, setReply } = useCommentContext();
	const editorRef = useRef<UseCommentEditor | undefined>(undefined);
	const { session } = useAuthContext();
	const isAuthenticated = session !== null;
	const isMobile = useIsMobile();

	function setLike(comment: SerializedComment, v: boolean): void {
		if (v === comment.liked) {
			void fetcher.deleteRate({
				id: comment.id,
				page: comment.page,
			});
			onLikeUpdated(comment.id, undefined);
		} else {
			void fetcher.setRate({
				id: comment.id,
				page: comment.page,
				like: v,
			});
			onLikeUpdated(comment.id, v);
		}
	}

	const onLike = () => {
		setLike(comment, true);
	};

	const onDislike = () => {
		setLike(comment, false);
	};

	useEffect(() => {
		if (!isReplying) return;

		setTimeout(() => {
			editorRef.current?.commands.focus("end");
		}, 100);
	}, [isReplying]);

	return (
		<>
			<div className="mt-2 flex flex-row -mx-2">
				<button
					className={cn(
						rateVariants({
							active: comment.liked === true,
						}),
					)}
					disabled={!isAuthenticated}
					onClick={onLike}
					type="button"
				>
					<ThumbsUp aria-label="Like" className="size-4" />
					{comment.likes > 0 ? comment.likes : null}
				</button>
				<button
					className={cn(
						rateVariants({
							active: comment.liked === false,
						}),
					)}
					disabled={!isAuthenticated}
					onClick={onDislike}
					type="button"
				>
					<ThumbsDown aria-label="Dislike" className="size-4" />
					{comment.dislikes > 0 ? comment.dislikes : null}
				</button>
				{canReply && isAuthenticated ? (
					<button
						type="button"
						className={cn(rateVariants({ active: false }))}
						onClick={() => setReply(!isReplying)}
					>
						<ReplyIcon className="size-4" />
						Reply
					</button>
				) : null}
			</div>
			{isMobile ? (
				<Dialog open={isReplying} onOpenChange={setReply}>
					<DialogContent
						aria-describedby="reply-description"
						onOpenAutoFocus={(e) => e.preventDefault()}
					>
						<DialogTitle className="sr-only">
							Replying to {comment.author.name}
						</DialogTitle>
						<ReplyForm
							editorRef={editorRef}
							comment={comment}
							onCancel={() => setReply(false)}
						/>
					</DialogContent>
				</Dialog>
			) : null}
			{!isMobile && isReplying ? (
				<ReplyForm
					className="mt-2"
					editorRef={editorRef}
					comment={comment}
					onCancel={() => setReply(false)}
				/>
			) : null}
		</>
	);
}
