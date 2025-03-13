import { type JSONContent, type Editor, EditorContent } from "@tiptap/react";
import {
	type HTMLAttributes,
	useLayoutEffect,
	forwardRef,
	useState,
	useRef,
	useEffect,
	type RefObject,
	type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import {
	Bold,
	Code,
	ImageIcon,
	Italic,
	LinkIcon,
	SquareCode,
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
import { buttonVariants } from "../button";
import { inputVariants } from "../input";

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

export function getPersistentId(id: string) {
	const storageKey = `fc_textarea_${id}`;
	const cached = sessionStorage.getItem(storageKey);

	return cached ? JSON.parse(cached) : null;
}

export function setPersistentId(id: string, value: object) {
	const storageKey = `fc_textarea_${id}`;
	sessionStorage.setItem(storageKey, JSON.stringify(value));
}

export function clearPersistentId(id: string) {
	const storageKey = `fc_textarea_${id}`;
	sessionStorage.removeItem(storageKey);
}

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
	({ editorRef, disabled = false, containerProps, ...props }, ref) => {
		const [editor, setEditor] = useState<Editor>();
		const mention = useMention();
		const storage = useStorage();

		// force editor props to be immutable
		const propsRef = useRef({
			...props,
			mentionEnabled: mention.enabled,
		});

		useLayoutEffect(() => {
			let instance: Editor | undefined;
			const { persistentId, defaultValue } = propsRef.current;

			let timeout: number | undefined;
			const save = () => {
				if (instance && persistentId)
					setPersistentId(persistentId, instance.getJSON());
			};

			void createEditorLazy({
				autofocus: false,
				content: persistentId
					? (getPersistentId(persistentId) ?? defaultValue)
					: defaultValue,
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

					if (persistentId && v.transaction.docChanged) {
						clearTimeout(timeout);
						timeout = window.setTimeout(save, 500);
					}
				},
			}).then((res) => {
				instance = res;
				setEditor(instance);
			});

			return () => {
				if (!instance) return;
				instance.destroy();
			};
		}, []);

		if (!editor) {
			return (
				<div
					{...containerProps}
					ref={ref}
					className={cn(editorVariants(), "p-1", containerProps?.className)}
				>
					<p
						{...props.editorProps}
						className={cn(
							"px-3 py-2.5 text-[15px] text-fc-muted-foreground mb-9",
							props.editorProps?.className,
						)}
					>
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
				<div className="flex flex-row items-center p-1">
					<MarkButton
						editor={editor}
						name="bold"
						icon={<Bold className="size-4" />}
					/>
					<MarkButton
						editor={editor}
						name="italic"
						icon={<Italic className="size-4" />}
					/>
					<MarkButton
						editor={editor}
						name="strike"
						icon={<Strikethrough className="size-4" />}
					/>
					<MarkButton
						editor={editor}
						name="code"
						icon={<Code className="size-4" />}
					/>
					<div className="w-px h-4 bg-fc-border mx-0.5 last:hidden" />
					<UpdateLink editor={editor} />
					<CodeBlockButton editor={editor} />

					{storage.enabled ? <UploadImageDialog editor={editor} /> : null}
				</div>
			</div>
		);
	},
);

function CodeBlockButton({ editor }: { editor: Editor }): React.ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	useHookUpdate(editor);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="Toggle CodeBlock"
				className={cn(toggleVariants({ active: editor.isActive("codeBlock") }))}
			>
				<SquareCode className="size-4" />
			</DialogTrigger>
			<DialogContent
				onCloseAutoFocus={(e) => {
					editor.commands.focus();
					e.preventDefault();
				}}
			>
				<DialogTitle>Code Block</DialogTitle>
				<DialogDescription>Choose a language.</DialogDescription>
				<CodeBlockForm editor={editor} onClose={() => setIsOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function CodeBlockForm({
	editor,
	onClose,
}: { editor: Editor; onClose: () => void }) {
	const [language, setLanguage] = useState(
		editor.getAttributes("codeBlock").language ?? "plaintext",
	);

	return (
		<form
			className="flex flex-row gap-2"
			onSubmit={(e) => {
				editor.commands.setCodeBlock({
					language,
				});

				onClose();
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<input
				className={cn(inputVariants(), "flex-1")}
				value={language}
				onChange={(e) => setLanguage(e.target.value)}
			/>
			<button type="submit" className={cn(buttonVariants())}>
				{editor.isActive("codeBlock") ? "Update" : "Done"}
			</button>
		</form>
	);
}

function MarkButton({
	editor,
	name,
	icon,
}: { editor: Editor; name: string; icon: ReactNode }): React.ReactNode {
	useHookUpdate(editor);

	return (
		<button
			key={name}
			type="button"
			aria-label={`Toggle ${name}`}
			className={cn(
				toggleVariants({
					active: editor.isActive(name),
				}),
			)}
			disabled={!editor.can().toggleMark(name) || !editor.isEditable}
			onMouseDown={(e) => {
				editor.commands.toggleMark(name);
				e.preventDefault();
			}}
		>
			{icon}
		</button>
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
				<DialogDescription>Insert an image to your comment.</DialogDescription>
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
				<DialogDescription>
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

function useHookUpdate(editor: Editor): void {
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		const onUpdate = (): void => {
			forceUpdate((prev) => prev + 1);
		};

		editor.on("transaction", onUpdate);
		return () => {
			editor.off("transaction", onUpdate);
		};
	}, [editor]);
}
