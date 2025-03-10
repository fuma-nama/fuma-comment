import useSWRMutation from "swr/mutation";
import { SendIcon } from "lucide-react";
import {
	type FormHTMLAttributes,
	forwardRef,
	useCallback,
	useRef,
	useState,
} from "react";
import { useAuthContext } from "../../contexts/auth";
import { cn } from "../../utils/cn";
import {
	type FetcherError,
	getCommentsKey,
	postComment,
} from "../../utils/fetcher";
import { useCommentsContext } from "../../contexts/comments";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import { CommentEditor, type UseCommentEditor } from "../editor";
import { Spinner } from "../spinner";
import { updateCommentList } from "../../utils/comment-list";
import { syncComments } from "../../utils/comment-manager";
import { AuthButton } from "../../atom";

export const CreateForm = forwardRef<
	HTMLFormElement,
	FormHTMLAttributes<HTMLFormElement>
>((props, ref) => {
	const auth = useAuthContext();
	const { page } = useCommentsContext();
	const [isEmpty, setIsEmpty] = useState(true);
	const editorRef = useRef<UseCommentEditor | undefined>(undefined);
	const mutation = useSWRMutation(
		getCommentsKey({
			page,
		}),
		(_, { arg }: { arg: { content: object } }) =>
			postComment({
				page,
				...arg,
			}),
		{
			onSuccess: (data) => {
				updateCommentList([data.page, data.threadId], (v) =>
					v ? [data, ...v] : undefined,
				);
				syncComments([data]);
				editorRef.current?.commands.clearContent(true);
			},
			revalidate: false,
		},
	);
	const disabled = mutation.isMutating;

	const submit = useLatestCallback(() => {
		if (auth.isLoading || auth.session === null) return;
		if (!editorRef.current) return;
		const content = editorRef.current.getJSON();

		if (content.length === 0) return;
		void mutation.trigger({ content });
	});

	return (
		<form
			ref={ref}
			onSubmit={(e) => {
				submit();
				e.preventDefault();
			}}
			{...props}
			className={cn("relative", props.className)}
		>
			{mutation.error ? (
				<p className="mb-1 text-sm text-fc-error">
					{(mutation.error as FetcherError).message}
				</p>
			) : null}
			<CommentEditor
				persistentId="create"
				containerProps={{
					className: "border-none p-1 rounded-b-none",
				}}
				editorProps={{
					className: 'min-h-[48px]'
				}}
				editorRef={editorRef}
				disabled={disabled}
				onChange={useCallback((v: UseCommentEditor) => {
					setIsEmpty(v.isEmpty);
				}, [])}
				onSubmit={submit}
				placeholder="Leave comment"
			/>
			{auth.isLoading || auth.session ? (
				<button
					aria-label="Send "
					className={cn(
						buttonVariants({
							className: "absolute right-3.5 bottom-3",
							size: "icon",
						}),
					)}
					disabled={disabled || isEmpty}
					type="submit"
				>
					{mutation.isMutating ? <Spinner /> : <SendIcon className="size-4" />}
				</button>
			) : (
				<AuthButton
					className={cn(
						buttonVariants({
							size: "small",
							className: "absolute right-3.5 bottom-3",
						}),
					)}
				/>
			)}
		</form>
	);
});

CreateForm.displayName = "CreateForm";
