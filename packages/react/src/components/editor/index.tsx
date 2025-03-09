import { type JSONContent, type Editor, EditorContent } from "@tiptap/react";
import {
	type HTMLAttributes,
	useLayoutEffect,
	forwardRef,
	useState,
	useRef,
	useEffect,
	type RefObject,
} from "react";
import { cva } from "class-variance-authority";
import {
	Bold,
	Code,
	ImageIcon,
	Italic,
	LinkIcon,
	Strikethrough,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useStorage } from "../../contexts/storage";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "../dialog";
import { useMention } from "../../contexts/mention";
import { UploadImage } from "./image-upload";
import { HyperLink } from "./hyper-link";
import { createEditorLazy } from "./lazy-load";

export type UseCommentEditor = Editor;

export interface EditorProps {
	defaultValue?: JSONContent;
	placeholder?: string;
	disabled?: boolean;
	editorRef?: RefObject<UseCommentEditor | undefined>;

	onChange?: (editor: UseCommentEditor) => void;
	onSubmit?: (editor: UseCommentEditor) => void;
	onEscape?: (editor: UseCommentEditor) => void;
	containerProps?: HTMLAttributes<HTMLDivElement>;
	editorProps?: HTMLAttributes<HTMLDivElement>;

	persistentId?: string;
}

export function useCommentEditor(): [
	editor: UseCommentEditor | null,
	setEditor: (editor: UseCommentEditor) => void,
] {
	return useState<UseCommentEditor | null>(null);
}

const editorVariants = cva(
	"rounded-xl border border-fc-border bg-fc-card text-base transition-colors focus-within:ring-2 focus-within:ring-fc-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-80",
);

const toggleVariants = cva(
	"inline-flex rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			active: {
				true: "bg-fc-primary text-fc-primary-foreground",
				false: "hover:bg-fc-accent",
			},
		},
		defaultVariants: {
			active: false,
		},
	},
);

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
	({ editorRef, disabled = false, containerProps, ...props }, ref) => {
		const [editor, setEditor] = useState<Editor>();
		const mention = useMention();

		// force editor props to be immutable
		const propsRef = useRef({
			...props,
			mentionEnabled: mention.enabled,
		});

		useLayoutEffect(() => {
			let instance: Editor | undefined;
			const storageKey = propsRef.current.persistentId
				? `fc_textarea_${propsRef.current.persistentId}`
				: null;
			const cached = storageKey ? sessionStorage.getItem(storageKey) : null;

			const save = (): void => {
				if (!instance || !storageKey) return;
				sessionStorage.setItem(storageKey, JSON.stringify(instance.getJSON()));
			};

			let timeout: number | undefined;
			void createEditorLazy({
				autofocus: false,
				content: cached ? JSON.parse(cached) : propsRef.current.defaultValue,
				editorProps: {
					attributes: {
						class: "flex-1 px-3 pt-2.5 focus-visible:outline-none",
					},
				},
				onEscape: () => {
					if (instance) propsRef.current.onEscape?.(instance);
					return true;
				},
				onSubmit: () => {
					if (instance) propsRef.current.onSubmit?.(instance);
					return true;
				},
				mentionEnabled: propsRef.current.mentionEnabled,
				placeholder: propsRef.current.placeholder,
				onTransaction(v) {
					propsRef.current.onChange?.(v.editor as Editor);

					if (storageKey) {
						clearTimeout(timeout);
						timeout = window.setTimeout(save, 800);
					}
				},
			}).then((res) => {
				instance = res;
				setEditor(instance);
			});

			return () => {
				if (!instance) return;
				save();
				instance.destroy();
			};
		}, []);

		if (!editor) {
			return (
				<div
					{...containerProps}
					ref={ref}
					className={cn(
						editorVariants(),
						"min-h-[72px]",
						containerProps?.className,
					)}
				>
					<p className="px-3 py-2.5 text-sm text-fc-muted-foreground">
						{props.placeholder}
					</p>
				</div>
			);
		}

		if (editorRef) editorRef.current = editor;
		if (editor.isEditable === disabled) {
			editor.setEditable(!disabled);
		}

		return (
			<div
				{...containerProps}
				aria-disabled={disabled}
				className={cn(editorVariants(), containerProps?.className)}
				ref={ref}
			>
				<EditorContent editor={editor} {...props.editorProps} />
				<ActionBar editor={editor} />
			</div>
		);
	},
);

const actions = [
	{
		name: "bold",
		icon: <Bold className="size-4" />,
	},
	{
		name: "strike",
		icon: <Strikethrough className="size-4" />,
	},
	{
		name: "italic",
		icon: <Italic className="size-4" />,
	},
	{
		name: "code",
		icon: <Code className="size-4" />,
	},
];
function ActionBar({ editor }: { editor: Editor }): React.ReactElement {
	const storage = useStorage();
	const [, forceUpdate] = useState<unknown>();

	useEffect(() => {
		const onUpdate = (): void => {
			forceUpdate({});
		};

		editor.on("transaction", onUpdate);
		return () => {
			editor.off("transaction", onUpdate);
		};
	}, [editor]);

	return (
		<div className="flex flex-row items-center p-1">
			{actions.map((mark) => (
				<button
					key={mark.name}
					type="button"
					aria-label={`Toggle ${mark.name}`}
					className={cn(
						toggleVariants({
							active: editor.isActive(mark.name),
						}),
					)}
					disabled={!editor.can().toggleMark(mark.name) || !editor.isEditable}
					onMouseDown={(e) => {
						editor.commands.toggleMark(mark.name);
						e.preventDefault();
					}}
				>
					{mark.icon}
				</button>
			))}
			<UpdateLink editor={editor} />
			{storage.enabled ? (
				<>
					<div className="mx-1 h-4 w-px bg-fc-border" />
					<UploadImageDialog editor={editor} />
				</>
			) : null}
		</div>
	);
}

function UploadImageDialog({ editor }: { editor: Editor }): React.ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="Upload Image"
				className={cn(toggleVariants())}
				disabled={!editor.can().setImage({ src: "" }) || !editor.isEditable}
			>
				<ImageIcon className="size-4" />
			</DialogTrigger>
			<DialogContent
				onCloseAutoFocus={(e) => {
					editor.commands.focus();
					e.preventDefault();
				}}
			>
				<DialogTitle>Add Image</DialogTitle>
				<DialogDescription className="mb-4 text-sm text-fc-muted-foreground">
					Insert an image to your comment.
				</DialogDescription>
				<UploadImage
					editor={editor}
					onClose={() => {
						setIsOpen(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function UpdateLink({ editor }: { editor: Editor }): React.ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="Toggle Link"
				className={cn(toggleVariants({ active: editor.isActive("link") }))}
				disabled={!editor.can().setLink({ href: "" }) || !editor.isEditable}
			>
				<LinkIcon className="size-4" />
			</DialogTrigger>
			<DialogContent
				onCloseAutoFocus={(e) => {
					editor.commands.focus();
					e.preventDefault();
				}}
			>
				<DialogTitle>Add Link</DialogTitle>
				<DialogDescription className="mb-4 text-sm text-fc-muted-foreground">
					Insert hype links to your comment.
				</DialogDescription>
				<HyperLink
					editor={editor}
					onClose={() => {
						setIsOpen(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

CommentEditor.displayName = "Editor";
