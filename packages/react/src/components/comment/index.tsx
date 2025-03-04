import {
	useState,
	useMemo,
	useLayoutEffect,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { MoreVertical } from "lucide-react";
import { type JSONContent } from "@tiptap/react";
import { cn } from "../../utils/cn";
import { toLocalString } from "../../utils/date";
import { deleteComment, getCommentsKey } from "../../utils/fetcher";
import {
	type CommentContext,
	useCommentContext,
	CommentProvider,
} from "../../contexts/comment";
import { useAuthContext } from "../../contexts/auth";
import {
	onCommentDeleted,
	useCommentManager,
} from "../../utils/comment-manager";
import { MenuTrigger, MenuItems, MenuItem, Menu } from "../menu";
import { buttonVariants } from "../button";
import type { UseCommentEditor } from "../editor";
import { Avatar } from "../avatar";
import { EditForm } from "./edit-form";
import { ContentRenderer } from "./content-renderer";

export function Comment({
	comment: cached,
	actions,
	children,
}: {
	comment: SerializedComment;
	actions?: ReactNode;
	children?: ReactNode;
}): React.ReactElement {
	const [timestamp, setTimestamp] = useState("");
	const [edit, setEdit] = useState(false);
	const [isReply, setIsReply] = useState(false);
	const editorRef = useRef<UseCommentEditor | undefined>(undefined);
	const comment = useCommentManager(cached.id) ?? cached;

	const context = useMemo<CommentContext>(() => {
		return {
			isEditing: edit,
			isReplying: isReply,
			setEdit,
			editorRef,
			setReply: setIsReply,
			comment,
		};
	}, [comment, edit, isReply]);

	useLayoutEffect(() => {
		const parsed = new Date(comment.timestamp);
		setTimestamp(toLocalString(parsed));
	}, [comment.timestamp]);

	return (
		<CommentProvider value={context}>
			<div
				className="relative flex flex-row gap-2 px-3 py-4 text-sm"
				data-fc-comment={context.comment.id}
				data-fc-edit={context.isEditing}
				data-fc-reply={context.isReplying}
			>
				<Avatar
					placeholder={comment.author.name}
					image={comment.author.image}
					className="shrink-0"
				/>
				<div className="min-w-0 flex-1 overflow-hidden">
					<div className="mb-2 flex flex-row items-center gap-2">
						<span className="truncate font-semibold">
							{comment.author.name}
						</span>
						<span className="text-xs text-fc-muted-foreground">
							{timestamp}
						</span>
						<CommentMenu />
					</div>
					{edit ? (
						<EditForm />
					) : (
						<>
							<ContentRenderer content={comment.content} />
							{actions}
						</>
					)}
				</div>
			</div>
			{children}
		</CommentProvider>
	);
}

function CommentMenu(): React.ReactNode {
	const { session } = useAuthContext();
	const { comment, editorRef, isEditing, isReplying, setEdit } =
		useCommentContext();

	const deleteMutation = useSWRMutation(
		getCommentsKey({
			thread: comment.threadId,
			page: comment.page,
		}),
		() => deleteComment(comment),
		{
			onSuccess() {
				onCommentDeleted(comment);
			},
			revalidate: false,
		},
	);

	const canEdit = session !== null && session.id === comment.author.id;
	const canDelete =
		session !== null &&
		(session.permissions?.delete || session.id === comment.author.id);

	const onCopy = useCallback(() => {
		const text = getTextFromContent(comment.content as JSONContent);

		void navigator.clipboard.writeText(text);
	}, [comment.content]);

	const onEdit = useCallback(() => {
		setEdit(true);
	}, [setEdit]);

	const onDelete = useCallback((): void => {
		void deleteMutation.trigger();
	}, [deleteMutation]);

	return (
		<Menu>
			<MenuTrigger
				aria-label="Open Menu"
				className={cn(
					buttonVariants({
						size: "icon",
						variant: "ghost",
						className:
							"ml-auto text-fc-muted-foreground data-[state=open]:bg-fc-accent data-[state=open]:text-fc-accent-foreground disabled:invisible",
					}),
				)}
				disabled={isEditing || isReplying}
			>
				<MoreVertical className="size-4" />
			</MenuTrigger>
			<MenuItems
				onCloseAutoFocus={(e) => {
					editorRef.current?.commands.focus("end");
					e.preventDefault();
				}}
			>
				<MenuItem onSelect={onCopy}>Copy</MenuItem>
				{canEdit ? <MenuItem onSelect={onEdit}>Edit</MenuItem> : null}
				{canDelete ? (
					<MenuItem disabled={deleteMutation.isMutating} onSelect={onDelete}>
						Delete
					</MenuItem>
				) : null}
			</MenuItems>
		</Menu>
	);
}

function getTextFromContent(content: JSONContent): string {
	if (content.type === "text") return content.text ?? "";
	const child = (content.content?.map((c) => getTextFromContent(c)) ?? [])
		.join("")
		.trimEnd();

	if (content.type === "paragraph") return `${child}\n`;
	return child;
}
