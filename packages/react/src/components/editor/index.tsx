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
	lazy,
} from "react";
import { cva } from "class-variance-authority";
import { Bold, Code, Italic, LinkIcon, Strikethrough } from "lucide-react";
import { cn } from "../../utils/cn";
import { useStorage } from "../../contexts/storage";
import { useMention } from "../../contexts/mention";
import { HyperLink } from "./hyper-link";
import { createEditorLazy } from "./lazy-load";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../dialog";

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
	children?: ReactNode;

	persistentId?: string;
}

export function useCommentEditor(): [
	editor: UseCommentEditor | null,
	setEditor: (editor: UseCommentEditor) => void,
] {
	return useState<UseCommentEditor | null>(null);
}

export const editorVariants = cva(
	"rounded-xl border border-fc-border bg-fc-card text-base transition-colors focus-within:ring-2 focus-within:ring-fc-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-80",
);

export const toggleVariants = cva(
	"inline-flex rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			active: {
				true: "bg-fc-accent text-fc-accent-foreground",
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

const EmojiPickerButton = lazy(() => import("./emoji-picker"));
const CodeBlockButton = lazy(() => import("./codeblock"));
const ImageUploadButton = lazy(() => import("./image-upload"));

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
	(
		{ editorRef, disabled = false, containerProps, children, ...props },
		ref,
	) => {
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
							"px-3 py-2.5 h-[38px] text-fc-muted-foreground mb-9",
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
				<EditorContent
					editor={editor}
					{...props.editorProps}
					className={cn("min-h-[38px]", props.editorProps?.className)}
				/>
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
					<EmojiPickerButton editor={editor} />
					{storage.enabled ? <ImageUploadButton editor={editor} /> : null}
					<div className="flex-1" />
					{children}
				</div>
			</div>
		);
	},
);

CommentEditor.displayName = "Editor";

function MarkButton({
	editor,
	name,
	icon,
}: {
	editor: Editor;
	name: string;
	icon: ReactNode;
}): React.ReactNode {
	useHookUpdate(editor);

	return (
		<button
			key={name}
			type="button"
			aria-label={`切換 ${name}`}
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

function UpdateLink({ editor }: { editor: Editor }): React.ReactElement {
	useHookUpdate(editor);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="切換連結"
				className={cn(toggleVariants({ active: editor.isActive("link") }))}
				disabled={!editor.can().setLink({ href: "" }) || !editor.isEditable}
			>
				<LinkIcon className="size-4" />
			</DialogTrigger>
			<DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
				<DialogTitle>新增連結</DialogTitle>
				<HyperLink
					editor={editor}
					onClose={() => {
						setIsOpen(false);
						editor.commands.focus();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

export function useHookUpdate(editor: Editor): void {
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
