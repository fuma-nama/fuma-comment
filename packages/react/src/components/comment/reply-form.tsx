import useSWRMutation from "swr/mutation";
import {
	type HTMLAttributes,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useState,
} from "react";
import { cn } from "../../utils/cn";
import { type FetcherError, getCommentsKey } from "../../utils/fetcher";
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
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import { useIsMobile } from "../../utils/use-media-query";
import { useCommentsContext } from "../../contexts/comments";

export function ReplyProvider({
	title,
	open,
	setOpen,
	editorRef,
	children,
}: {
	title: string;
	editorRef: RefObject<UseCommentEditor | undefined>;
	open: boolean;
	setOpen: (open: boolean) => void;
	children: ReactNode;
}) {
	const isMobile = useIsMobile();

	useEffect(() => {
		if (open && !isMobile) {
			setTimeout(() => {
				editorRef.current?.commands.focus("end");
			}, 10);
		}
	}, [open, editorRef, isMobile]);

	if (isMobile) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				{children}
				<DialogContent
					position="bottom"
					aria-describedby="reply-description"
					onOpenAutoFocus={(e) => {
						setTimeout(() => {
							editorRef.current?.commands.focus("end");
						}, 10);
						e.preventDefault();
					}}
				>
					<DialogTitle>{title}</DialogTitle>
					<ReplyForm editorRef={editorRef} />
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<>
			{children}
			{open ? <ReplyForm editorRef={editorRef} className="mt-2" /> : null}
		</>
	);
}

function ReplyForm({
	editorRef,
	...props
}: HTMLAttributes<HTMLFormElement> & {
	editorRef: RefObject<UseCommentEditor | undefined>;
}): ReactNode {
	const [isEmpty, setIsEmpty] = useState(true);
	const { comment, setReply } = useCommentContext();
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
			{...props}
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
