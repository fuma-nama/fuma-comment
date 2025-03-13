import {
	useState,
	useMemo,
	useRef,
	type ReactNode,
	type ButtonHTMLAttributes,
} from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { CopyIcon, MoreVertical, PencilIcon, Trash2Icon } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { cn } from "../../utils/cn";
import { getCommentsKey } from "../../utils/fetcher";
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
import { Timestamp } from "../timestamp";
import { useCommentsContext } from "../../contexts/comments";

export function Comment({
	comment: cached,
	actions,
	children,
}: {
	comment: SerializedComment;
	actions?: ReactNode;
	children?: ReactNode;
}): React.ReactElement {
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

	return (
		<CommentProvider value={context}>
			<div
				className="relative flex flex-row gap-2 p-4 text-sm"
				data-fc-comment={context.comment.id}
				data-fc-edit={context.isEditing}
				data-fc-reply={context.isReplying}
			>
				<Avatar
					placeholder={comment.author.name}
					image={comment.author.image}
					className="shrink-0"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-row items-center gap-2">
						<span className="truncate font-medium">{comment.author.name}</span>
						<span className="text-xs text-fc-muted-foreground">
							<Timestamp timestamp={comment.timestamp} />
						</span>
						<CommentMenu className="ms-auto -my-2" />
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

function CommentMenu({
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>): React.ReactNode {
	const { session } = useAuthContext();
	const { comment, editorRef, isEditing, isReplying, setEdit } =
		useCommentContext();
	const { fetcher } = useCommentsContext();

	const deleteMutation = useSWRMutation(
		getCommentsKey({
			thread: comment.threadId,
			page: comment.page,
		}),
		() => fetcher.deleteComment(comment),
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

	const onCopy = () => {
		const text = getTextFromContent(comment.content as JSONContent);

		void navigator.clipboard.writeText(text);
	};

	const onEdit = () => {
		setEdit(true);
	};

	const onDelete = () => {
		void deleteMutation.trigger();
	};

	return (
		<Menu>
			<MenuTrigger
				aria-label="Open Menu"
				className={cn(
					buttonVariants({
						size: "icon",
						variant: "ghost",
						className:
							"text-fc-muted-foreground data-[state=open]:bg-fc-accent data-[state=open]:text-fc-accent-foreground disabled:invisible",
					}),
					className,
				)}
				disabled={isEditing || isReplying}
				{...props}
			>
				<MoreVertical className="size-4" />
			</MenuTrigger>
			<MenuItems
				onCloseAutoFocus={(e) => {
					editorRef.current?.commands.focus("end");
					e.preventDefault();
				}}
			>
				<MenuItem onSelect={onCopy}>
					Copy
					<CopyIcon />
				</MenuItem>
				{canEdit ? (
					<MenuItem onSelect={onEdit}>
						Edit
						<PencilIcon />
					</MenuItem>
				) : null}
				{canDelete ? (
					<MenuItem
						disabled={deleteMutation.isMutating}
						onSelect={onDelete}
						variant="destructive"
					>
						Delete
						<Trash2Icon />
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
