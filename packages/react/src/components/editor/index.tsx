import { type JSONContent, type Editor, EditorContent } from "@tiptap/react";
import {
  type HTMLAttributes,
  useLayoutEffect,
  forwardRef,
  useState,
  useCallback,
  type MutableRefObject,
  useRef,
} from "react";
import { cva } from "class-variance-authority";
import {
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
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
import { UploadImage } from "../functions/image-upload";
import { HyperLink } from "../functions/hyper-link";
import { Spinner } from "../spinner";
import { createEditorLazy } from "./lazy-load";

export type UseCommentEditor = Editor;

export interface EditorProps {
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

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
  ({ editorRef, disabled = false, ...props }, ref) => {
    const [_, forceUpdate] = useState<unknown>();
    const [editor, setEditor] = useState<Editor>();

    // force editor props to be immutable
    const initialProps = useRef(props);

    useLayoutEffect(() => {
      let instance: Editor | undefined;

      void createEditorLazy({
        autofocus: false,
        content: initialProps.current.defaultValue,
        editorProps: {
          attributes: {
            class: cn(tiptapVariants()),
          },
        },
        onEscape: () => {
          if (instance) initialProps.current.onEscape?.(instance);
          return true;
        },
        onSubmit: () => {
          if (instance) initialProps.current.onSubmit?.(instance);
          return true;
        },
        placeholder: initialProps.current.placeholder,
        onTransaction(v) {
          forceUpdate({});
          initialProps.current.onChange?.(v.editor as Editor);
        },
      }).then((res) => {
        instance = res;
        setEditor(instance);
      });

      return () => {
        instance?.destroy();
      };
    }, []);

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

    if (editorRef) editorRef.current = editor;
    if (editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }

    return (
      <div aria-disabled={disabled} className={cn(editorVariants())} ref={ref}>
        <EditorContent editor={editor} {...props.editorProps} />
        <ActionBar editor={editor} />
      </div>
    );
  },
);

const actions = [
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
];
function ActionBar({ editor }: { editor: Editor }): React.ReactElement {
  const storage = useStorage();

  return (
    <div className="flex flex-row items-center gap-0.5 px-1.5">
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
