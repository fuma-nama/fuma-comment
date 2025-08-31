import useSWRMutation from "swr/mutation";
import { Pencil } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "../../utils/cn";
import { getCommentsKey } from "../../utils/fetcher";
import { useCommentContext } from "../../contexts/comment";
import { updateComment } from "../../utils/comment-manager";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import {
	clearPersistentId,
	CommentEditor,
	type UseCommentEditor,
} from "../editor";
import { Spinner } from "../spinner";
import { useCommentsContext } from "../../contexts/comments";

export function EditForm({
	onClose,
}: {
	onClose: () => void;
}): React.ReactNode {
	const [isEmpty, setIsEmpty] = useState(false);
	const { comment, editorRef } = useCommentContext();
	const { fetcher } = useCommentsContext();

	const mutation = useSWRMutation(
		getCommentsKey({
			page: comment.page,
			thread: comment.threadId,
		}),
		(_, { arg }: { arg: { content: object } }) =>
			fetcher.editComment({
				id: comment.id,
				page: comment.page,
				...arg,
			}),
		{
			revalidate: false,
		},
	);

	const submit = useLatestCallback(() => {
		if (!editorRef.current) return;
		if (editorRef.current.isEmpty) return;

		const content = editorRef.current.getJSON();
		clearPersistentId(`edit-${comment.id}`);
		void mutation.trigger(
			{ content },
			{
				onSuccess() {
					onClose();
					updateComment(comment.id, (item) => ({ ...item, content }));
				},
			},
		);
	});

	return (
		<form
			className="relative"
			onSubmit={(e) => {
				submit();
				e.preventDefault();
			}}
		>
			<CommentEditor
				persistentId={`edit-${comment.id}`}
				defaultValue={comment.content}
				disabled={mutation.isMutating}
				editorRef={editorRef}
				onChange={useCallback((v: UseCommentEditor) => {
					setIsEmpty(v.isEmpty);
				}, [])}
				onEscape={onClose}
				onSubmit={submit}
				placeholder="Edit Message"
			>
				<button
					aria-label="Edit"
					className={cn(
						buttonVariants({
							variant: "primary",
							size: "icon",
						}),
					)}
					disabled={mutation.isMutating || isEmpty}
					type="submit"
				>
					{mutation.isMutating ? <Spinner /> : <Pencil className="size-4" />}
				</button>
			</CommentEditor>
		</form>
	);
}
