import useSWRMutation from "swr/mutation";
import {
	type HTMLAttributes,
	type ReactNode,
	type RefObject,
	useCallback,
	useState,
} from "react";
import { cn } from "../../utils/cn";
import { type FetcherError, getCommentsKey } from "../../utils/fetcher";
import { onCommentReplied } from "../../utils/comment-manager";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import {
	clearPersistentId,
	CommentEditor,
	type UseCommentEditor,
} from "../editor";
import { Spinner } from "../spinner";
import { useCommentsContext } from "../../contexts/comments";
import type { SerializedComment } from "@fuma-comment/server";
import { SendHorizonalIcon } from "lucide-react";

export function ReplyForm({
	editorRef,
	onCancel,
	comment,
	...props
}: HTMLAttributes<HTMLFormElement> & {
	comment: SerializedComment;
	onCancel?: () => void;
	editorRef: RefObject<UseCommentEditor | undefined>;
}): ReactNode {
	const [isEmpty, setIsEmpty] = useState(true);
	const { fetcher } = useCommentsContext();

	const mutation = useSWRMutation(
		getCommentsKey({
			thread: comment.threadId ?? comment.id,
			page: comment.page,
		}),
		(key, { arg }: { arg: { content: object } }) =>
			fetcher.postComment({
				...key[1],
				...arg,
			}),
		{
			revalidate: false,
			onSuccess(data) {
				onCommentReplied(data);
				onCancel?.();
				editorRef.current?.commands.clearContent();
			},
		},
	);

	const submit = useLatestCallback(() => {
		if (!editorRef.current) return;
		const content = editorRef.current.getJSON();

		if (content.length === 0) return;
		clearPersistentId(`reply-${comment.id}`);
		void mutation.trigger({ content });
	});

	return (
		<form
			{...props}
			className={cn("relative", props.className)}
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
				onEscape={onCancel}
				onSubmit={submit}
				placeholder="Reply to comment"
			/>
			<button
				aria-label="Reply"
				className={cn(
					buttonVariants({
						size: "icon",
						className: "absolute right-1.5 bottom-2",
					}),
				)}
				disabled={mutation.isMutating || isEmpty}
				type="submit"
			>
				{mutation.isMutating ? (
					<Spinner />
				) : (
					<SendHorizonalIcon className="size-4" />
				)}
			</button>
			{mutation.error ? (
				<p className="mt-1 text-sm text-fc-error">
					{(mutation.error as FetcherError).message}
				</p>
			) : null}
		</form>
	);
}
