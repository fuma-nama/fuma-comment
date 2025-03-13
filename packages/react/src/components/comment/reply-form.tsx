import useSWRMutation from "swr/mutation";
import { type ReactNode, type RefObject, useCallback, useState } from "react";
import { cn } from "../../utils/cn";
import {
	type FetcherError,
	getCommentsKey,
	postComment,
} from "../../utils/fetcher";
import { useCommentContext } from "../../contexts/comment";
import { onCommentReplied } from "../../utils/comment-manager";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import {
	clearPersistentId,
	CommentEditor,
	type UseCommentEditor,
} from "../editor";
import { Spinner } from "../spinner";
import { DialogTitle } from "../dialog";
import { toLocalString } from "../../utils/date";
import { Avatar } from "../avatar";
import { ContentRenderer } from "./content-renderer";

export function ReplyHeader(): ReactNode {
	const { comment } = useCommentContext();

	return (
		<>
			<DialogTitle>Replying to {comment.author.name}</DialogTitle>
			<div className="mb-2 flex flex-col gap-4 rounded-xl border border-fc-border p-3 text-sm">
				<div className="flex flex-row items-center gap-2 text-xs text-fc-muted-foreground">
					<Avatar
						className="size-6"
						placeholder={comment.author.name}
						image={comment.author.image}
					/>
					<span>{toLocalString(new Date(comment.timestamp))}</span>
				</div>
				<ContentRenderer content={comment.content} />
			</div>
		</>
	);
}

export function ReplyForm({
	editorRef,
}: {
	editorRef: RefObject<UseCommentEditor | undefined>;
}): ReactNode {
	const [isEmpty, setIsEmpty] = useState(true);
	const { comment, setReply } = useCommentContext();

	const mutation = useSWRMutation(
		getCommentsKey({
			thread: comment.threadId ?? comment.id,
			page: comment.page,
		}),
		(key, { arg }: { arg: { content: object } }) =>
			postComment({
				...key[1],
				...arg,
			}),
		{
			revalidate: false,
			onSuccess(data) {
				onCommentReplied(data);
				setReply(false);
			},
		},
	);

	const onClose = useLatestCallback(() => {
		setReply(false);
	});

	const submit = useLatestCallback(() => {
		if (!editorRef.current) return;
		const content = editorRef.current.getJSON();

		if (content.length === 0) return;
		clearPersistentId(`reply-${comment.id}`);
		void mutation.trigger({ content });
	});

	return (
		<form
			onSubmit={(e) => {
				submit();
				e.preventDefault();
			}}
		>
			<CommentEditor
				persistentId={`reply-${comment.id}`}
				disabled={mutation.isMutating}
				editorRef={editorRef}
				onChange={useCallback((v: UseCommentEditor) => {
					setIsEmpty(v.isEmpty);
				}, [])}
				onEscape={onClose}
				onSubmit={submit}
				placeholder="Reply to comment"
			/>
			<div className="mt-2 flex flex-row gap-1">
				<button
					className={cn(buttonVariants({ className: "gap-2" }))}
					disabled={mutation.isMutating || isEmpty}
					type="submit"
				>
					{mutation.isMutating ? <Spinner /> : null}
					Reply
				</button>
				<button
					className={cn(
						buttonVariants({
							variant: "secondary",
						}),
					)}
					onClick={onClose}
					type="button"
				>
					Cancel
				</button>
			</div>
			{mutation.error ? (
				<p className="mt-1 text-sm text-fc-error">
					{(mutation.error as FetcherError).message}
				</p>
			) : null}
		</form>
	);
}
