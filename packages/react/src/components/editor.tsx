import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import { Italic } from "@tiptap/extension-italic";
import { Strike } from "@tiptap/extension-strike";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/react";
import { Editor, Extension, EditorContent } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { History } from "@tiptap/extension-history";
import { Text } from "@tiptap/extension-text";
import type { HTMLAttributes } from "react";
import { useRef, forwardRef, useState, useEffect } from "react";
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
import useSWRMutation from "swr/mutation";
import { Image } from "@tiptap/extension-image";
import { cn } from "../utils/cn";
import { useStorage } from "../contexts/storage";
import { useLatestCallback, useObjectURL } from "../utils/hooks";
import { buttonVariants } from "./button";
import { inputVariants } from "./input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";
import { codeVariants } from "./comment-renderer";
import { Spinner } from "./spinner";

export interface UseCommentEditor {
  editor: Editor;
  isEmpty: boolean;
  getValue: () => JSONContent;
  clearValue: () => void;
}

export interface EditorProps {
  autofocus?: "start" | "end" | "all" | number | boolean;
  defaultValue?: JSONContent;
  placeholder?: string;
  disabled?: boolean;
  editor: UseCommentEditor | null;
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
  "rounded-xl border border-fc-border bg-fc-card pb-1 text-sm transition-colors focus-within:ring-2 focus-within:ring-fc-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-80",
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
  (
    {
      editor,
      defaultValue,
      disabled = false,
      placeholder,
      autofocus = false,
      editorProps,
      onChange,
      ...props
    },
    ref,
  ) => {
    const _defaultValue = useRef(defaultValue).current;
    const innerEditor = editor?.editor ?? null;
    const onSubmit = useLatestCallback(() => {
      if (editor) props.onSubmit?.(editor);
      return true;
    });
    const onEscape = useLatestCallback(() => {
      if (editor) props.onEscape?.(editor);
      return true;
    });

    useEffect(() => {
      const instance = new Editor({
        autofocus,
        content: _defaultValue,
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
            placeholder,
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
        onTransaction() {
          onChange?.(createCommentEditor(instance));
        },
      });

      onChange?.(createCommentEditor(instance));

      return () => {
        instance.destroy();
      };
    }, [autofocus, _defaultValue, onChange, onEscape, onSubmit, placeholder]);

    const className = cn(editorVariants());

    if (!innerEditor) {
      return (
        <div aria-disabled className={className} ref={ref}>
          <div className={cn(tiptapVariants({ className: "tiptap" }))}>
            <p className="is-editor-empty" data-placeholder={placeholder} />
          </div>
        </div>
      );
    }

    innerEditor.setEditable(!disabled);

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- trigger focus
      <div
        aria-disabled={disabled}
        className={className}
        onMouseUp={() => {
          innerEditor.commands.focus();
        }}
        ref={ref}
      >
        <EditorContent editor={innerEditor} {...editorProps} />
        <ActionBar editor={innerEditor} />
      </div>
    );
  },
);

function ActionBar({ editor }: { editor: Editor }): JSX.Element {
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
          aria-label={`Toggle ${mark.name}`}
          className={cn(
            toggleVariants({
              active: editor.isActive(mark.name),
            }),
          )}
          disabled={!editor.can().toggleMark(mark.name) || !editor.isEditable}
          key={mark.name}
          onMouseDown={(e) => {
            editor.commands.toggleMark(mark.name);
            e.preventDefault();
          }}
          type="button"
        >
          {mark.icon}
        </button>
      ))}
      <UpdateLink editor={editor} />
      {storage.enabled ? (
        <>
          <div className="mx-1 h-4 w-px bg-fc-border" role="none" />
          <UploadMenu editor={editor} />
        </>
      ) : null}
    </div>
  );
}

function UploadMenu({ editor }: { editor: Editor }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger
        aria-label="Upload Image"
        className={cn(toggleVariants())}
        disabled={!editor.can().setImage({ src: "" }) || !editor.isEditable}
        type="button"
      >
        <ImageIcon className="size-4" />
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle>Add Image</DialogTitle>
        <UploadDialogContent
          editor={editor}
          onClose={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function UploadDialogContent({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}): JSX.Element {
  const storage = useStorage();
  const [file, setFile] = useState<Blob | null>(null);
  const fileUrl = useObjectURL(file);
  const mutation = useSWRMutation(
    "upload image",
    (_, { arg }: { arg: { file: Blob } }) => storage.upload(arg.file),
    {
      onSuccess: (data) => {
        onClose();
        editor
          .chain()
          .setImage({
            src: data.url,
            alt: data.alt,
            // @ts-expect-error -- add width, height properties
            width: data.width,
            height: data.height,
          })
          .focus()
          .run();
      },
    },
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (file) {
      void mutation.trigger({ file });
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files.item(0));
    }
  };

  return (
    <form className="flex flex-col" onSubmit={onSubmit}>
      <input
        accept="image/png, image/jpeg"
        hidden
        id="image"
        onChange={onChange}
        type="file"
      />
      {fileUrl ? (
        <label
          className="cursor-pointer overflow-hidden rounded-xl border border-fc-border bg-fc-muted"
          htmlFor="image"
        >
          <img alt="preview" className="mx-auto max-h-96" src={fileUrl} />
        </label>
      ) : (
        <label
          className="cursor-pointer rounded-xl border border-fc-border bg-fc-background p-4 text-center text-sm font-medium text-fc-muted-foreground"
          htmlFor="image"
        >
          Upload Image
        </label>
      )}

      <div className="mt-2 flex gap-1">
        <button
          className={cn(buttonVariants({ className: "gap-2" }))}
          disabled={mutation.isMutating}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : null}
          Save
        </button>
      </div>
    </form>
  );
}

function UpdateLink({ editor }: { editor: Editor }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger
        aria-label="Toggle Link"
        className={cn(toggleVariants())}
        disabled={!editor.can().setLink({ href: "" }) || !editor.isEditable}
        type="button"
      >
        <LinkIcon className="size-4" />
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle>Add Link</DialogTitle>
        <UpdateLinkDialogContent
          editor={editor}
          onClose={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function UpdateLinkDialogContent({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}): JSX.Element {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    editor.commands.extendMarkRange("link");

    const href = editor.getAttributes("link").href as string | undefined;
    const selection = editor.state.selection;
    const selected = editor.state.doc.textBetween(selection.from, selection.to);

    setName(selected);
    setValue(href ?? "");
  }, [editor]);

  const unset = (): void => {
    onClose();

    editor.chain().focus().unsetMark("link").run();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (value.trim().length === 0) return;
    const content = name.length > 0 ? name : value;

    onClose();
    if (!editor.state.selection.empty) {
      editor
        .chain()
        .deleteSelection()
        .setLink({ href: value })
        .insertContent(content)
        .focus()
        .run();
    } else {
      editor
        .chain()
        .setLink({ href: value })
        .insertContent(content)
        .unsetMark("link")
        .insertContent(" ")
        .focus()
        .run();
    }
  };

  return (
    <form className="flex flex-col gap-1" onSubmit={onSubmit}>
      <input
        className={cn(inputVariants())}
        id="name"
        onChange={(e) => {
          setName(e.target.value);
        }}
        placeholder="Name (optional)"
        value={name}
      />
      <input
        className={cn(inputVariants())}
        id="url"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder="URL"
        type="url"
        value={value}
      />
      <div className="mt-2 flex gap-1">
        <button className={cn(buttonVariants())} type="submit">
          Save
        </button>
        {editor.isActive("link") ? (
          <button
            className={cn(buttonVariants({ variant: "secondary" }))}
            onClick={unset}
            type="button"
          >
            Unset
          </button>
        ) : null}
      </div>
    </form>
  );
}

CommentEditor.displayName = "Editor";

function createCommentEditor(editor: Editor): UseCommentEditor {
  return {
    editor,
    isEmpty: editor.isEmpty,
    getValue() {
      return editor.getJSON();
    },
    clearValue() {
      editor.commands.clearContent(true);
    },
  };
}
