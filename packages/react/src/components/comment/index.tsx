import {
	useState,
	useMemo,
	useRef,
	type ReactNode,
	type ButtonHTMLAttributes,
	type ComponentProps,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "../dialog";

export function Comment({
	comment: cached,
	actions,
	children,
	...props
}: ComponentProps<"div"> & {
	comment: SerializedComment;
	actions?: ReactNode;
}): React.ReactElement {
	const [isReply, setIsReply] = useState(false);
	const editorRef = useRef<UseCommentEditor | undefined>(undefined);
	const comment = useCommentManager(cached.id) ?? cached;

	const context = useMemo<CommentContext>(() => {
		return {
			isReplying: isReply,
			editorRef,
			setReply: setIsReply,
			comment,
		};
	}, [comment, isReply]);

	return (
		<CommentProvider value={context}>
			<div
				{...props}
				className={cn(
					"relative flex flex-row gap-2 p-4 text-sm",
					props.className,
				)}
				data-fc-comment={context.comment.id}
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
					<ContentRenderer content={comment.content} />
					{actions}
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
	const [isEditing, setIsEditing] = useState(false);
	const { comment, editorRef, isReplying } = useCommentContext();
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
		setIsEditing(true);
	};

	const onDelete = () => {
		void deleteMutation.trigger();
	};

	return (
		<Dialog open={isEditing} onOpenChange={setIsEditing}>
			<DialogContent>
				<DialogTitle className="max-sm:sr-only">編輯評論</DialogTitle>
				<DialogDescription className="max-sm:sr-only">
					編輯您的評論內容。
				</DialogDescription>
				<EditForm onClose={() => setIsEditing(false)} />
			</DialogContent>
			<Menu>
				<MenuTrigger
					aria-label="開啟選單"
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
						複製
						<CopyIcon />
					</MenuItem>
					{canEdit ? (
						<MenuItem onSelect={onEdit}>
							編輯
							<PencilIcon />
						</MenuItem>
					) : null}
					{canDelete ? (
						<MenuItem
							disabled={deleteMutation.isMutating}
							onSelect={onDelete}
							variant="destructive"
						>
							刪除
							<Trash2Icon />
						</MenuItem>
					) : null}
				</MenuItems>
			</Menu>
		</Dialog>
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
