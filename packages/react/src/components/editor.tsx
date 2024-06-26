import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import { Italic } from "@tiptap/extension-italic";
import { Strike } from "@tiptap/extension-strike";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  type JSONContent,
  Editor,
  Extension,
  EditorContent,
} from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { History } from "@tiptap/extension-history";
import { Text } from "@tiptap/extension-text";
import {
  type HTMLAttributes,
  useLayoutEffect,
  forwardRef,
  useState,
  useCallback,
  type MutableRefObject,
} from "react";
import { cva } from "cva";
import {
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
} from "lucide-react";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { cn } from "../utils/cn";
import { useStorage } from "../contexts/storage";
import { useLatestCallback } from "../utils/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { codeVariants } from "./comment-renderer";
import { UploadImage } from "./functions/image-upload";
import { HyperLink } from "./functions/hyper-link";
import { Spinner } from "./spinner";

export type UseCommentEditor = Editor;

export interface EditorProps {
  autofocus?: "start" | "end" | "all" | number | boolean;
  defaultValue?: JSONContent;
  placeholder?: string;
  disabled?: boolean;
  editorRef?: MutableRefObject<UseCommentEditor | undefined>;

  onChange?: (editor: UseCommentEditor) => void;
  onSubmit?: (editor: UseCommentEditor) => void;
  onEscape?: (editor: UseCommentEditor) => void;
  editorProps?: HTMLAttributes<HTMLDivElement>;
}

export function useCommentEditor(): [
  editor: UseCommentEditor | null,
  setEditor: (editor: UseCommentEditor) => void,
] {
  return useState<UseCommentEditor | null>(null);
}

const editorVariants = cva(
  "rounded-xl border border-fc-border bg-fc-card text-sm transition-colors focus-within:ring-2 focus-within:ring-fc-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-80",
);

const tiptapVariants = cva("min-h-[40px] px-3 py-2 focus-visible:outline-none");

const toggleVariants = cva(
  "inline-flex rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      active: {
        true: "bg-fc-accent text-fc-accent-foreground",
      },
    },
  },
);

const ImageWithWidth = Image.extend({
  addAttributes() {
    return {
      src: {
        isRequired: true,
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      alt: {
        default: null,
      },
    };
  },
});

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
  ({ editorRef, disabled = false, autofocus = false, ...props }, ref) => {
    const [_, forceUpdate] = useState<unknown>();
    const onSubmit = useLatestCallback(() => {
      if (editor) props.onSubmit?.(editor);
      return true;
    });
    const onEscape = useLatestCallback(() => {
      if (editor) props.onEscape?.(editor);
      return true;
    });

    const createEditor = useLatestCallback(() => {
      return new Editor({
        autofocus,
        content: props.defaultValue,
        editorProps: {
          attributes: {
            class: cn(tiptapVariants()),
          },
        },
        extensions: [
          Document,
          Dropcursor,
          Gapcursor,
          Bold,
          Strike,
          Code.configure({
            HTMLAttributes: {
              class: codeVariants(),
            },
          }),
          Link.extend({ inclusive: false }).configure({
            openOnClick: false,
          }),
          Italic,
          History,
          Paragraph,
          ImageWithWidth,
          Text,
          Placeholder.configure({
            placeholder: props.placeholder,
            showOnlyWhenEditable: false,
          }),
          Extension.create({
            addKeyboardShortcuts() {
              return {
                "Mod-Enter": onSubmit,
                Escape: onEscape,
              };
            },
          }),
        ],
        onTransaction(v) {
          forceUpdate({});
          props.onChange?.(v.editor as UseCommentEditor);
        },
      });
    });

    const [editor, setEditor] = useState<Editor>();

    useLayoutEffect(() => {
      const instance = createEditor();
      setEditor(instance);
      if (editorRef) editorRef.current = instance;

      return () => {
        instance.destroy();
      };
    }, [createEditor, editorRef]);

    useLayoutEffect(() => {
      editor?.setEditable(!disabled);
    }, [disabled, editor]);

    if (!editor) {
      return (
        <div
          aria-disabled
          className={cn(
            editorVariants(),
            tiptapVariants({ className: "tiptap" }),
          )}
          ref={ref}
        >
          <div className="inline-flex items-center gap-2 text-sm text-fc-muted-foreground">
            <Spinner />
            Loading
          </div>
        </div>
      );
    }

    return (
      <div aria-disabled={disabled} className={cn(editorVariants())} ref={ref}>
        <EditorContent editor={editor} {...props.editorProps} />
        <ActionBar editor={editor} />
      </div>
    );
  },
);

function ActionBar({ editor }: { editor: Editor }): React.ReactElement {
  const storage = useStorage();

  return (
    <div className="flex flex-row items-center gap-0.5 px-1.5">
      {[
        {
          name: "bold",
          icon: <BoldIcon className="size-4" />,
        },
        {
          name: "strike",
          icon: <StrikethroughIcon className="size-4" />,
        },
        {
          name: "italic",
          icon: <ItalicIcon className="size-4" />,
        },
        {
          name: "code",
          icon: <CodeIcon className="size-4" />,
        },
      ].map((mark) => (
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
          <div className="mx-1 h-4 w-px bg-fc-border" role="none" />
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
        onPointerDown={(e) => {
          e.preventDefault();
        }}
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
          onClose={useCallback(() => {
            setIsOpen(false);
          }, [])}
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
        className={cn(toggleVariants())}
        disabled={!editor.can().setLink({ href: "" }) || !editor.isEditable}
        onPointerDown={(e) => {
          e.preventDefault();
        }}
      >
        <LinkIcon className="size-4" />
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => {
          if (!editor.isFocused) editor.commands.focus();
          e.preventDefault();
        }}
      >
        <DialogTitle>Add Link</DialogTitle>
        <DialogDescription className="mb-4 text-sm text-fc-muted-foreground">
          Insert hype links to your comment.
        </DialogDescription>
        <HyperLink
          editor={editor}
          onClose={useCallback(() => {
            setIsOpen(false);
          }, [])}
        />
      </DialogContent>
    </Dialog>
  );
}

CommentEditor.displayName = "Editor";
