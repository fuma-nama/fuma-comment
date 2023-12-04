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
  "fc-rounded-xl fc-border fc-border-border fc-bg-card fc-pb-1 fc-text-sm fc-transition-colors focus-within:fc-ring-2 focus-within:fc-ring-ring aria-disabled:fc-cursor-not-allowed aria-disabled:fc-opacity-80"
);

const tiptapVariants = cva(
  "fc-min-h-[40px] fc-px-3 fc-py-2 focus-visible:fc-outline-none"
);

const toggleVariants = cva(
  "fc-inline-flex fc-rounded-md fc-p-1 disabled:fc-cursor-not-allowed disabled:fc-opacity-50",
  {
    variants: {
      active: {
        true: "fc-bg-accent fc-text-accent-foreground",
      },
    },
  }
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
    ref
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
  }
);

function ActionBar({ editor }: { editor: Editor }): JSX.Element {
  return (
    <div className="fc-flex fc-flex-row fc-items-center fc-gap-0.5 fc-px-1.5">
      {[
        {
          name: "bold",
          icon: <BoldIcon className="fc-h-4 fc-w-4" />,
        },
        {
          name: "strike",
          icon: <StrikethroughIcon className="fc-h-4 fc-w-4" />,
        },
        {
          name: "italic",
          icon: <ItalicIcon className="fc-h-4 fc-w-4" />,
        },
        {
          name: "code",
          icon: <CodeIcon className="fc-h-4 fc-w-4" />,
        },
      ].map((mark) => (
        <button
          aria-label={`Toggle ${mark.name}`}
          className={cn(
            toggleVariants({
              active: editor.isActive(mark.name),
            })
          )}
          disabled={!editor.can().toggleMark(mark.name)}
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
      <UpdateLinkMenu editor={editor} />
      <div className="fc-mx-1 fc-h-4 fc-w-px fc-bg-border" role="none" />
      <UploadMenu editor={editor} />
    </div>
  );
}

function UploadMenu({ editor }: { editor: Editor }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const storage = useStorage();

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      {storage.enabled ? (
        <DialogTrigger
          aria-label="Upload Image"
          className={cn(toggleVariants())}
          type="button"
        >
          <ImageIcon className="fc-h-4 fc-w-4" />
        </DialogTrigger>
      ) : null}
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
    }
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
    <form className="fc-flex fc-flex-col" onSubmit={onSubmit}>
      <input
        accept="image/png, image/jpeg"
        hidden
        id="image"
        onChange={onChange}
        type="file"
      />
      {fileUrl ? (
        <label
          className="fc-cursor-pointer fc-overflow-hidden fc-rounded-xl fc-border fc-border-border fc-bg-muted"
          htmlFor="image"
        >
          <img alt="preview" className="fc-mx-auto fc-max-h-96" src={fileUrl} />
        </label>
      ) : (
        <label
          className="fc-cursor-pointer fc-rounded-xl fc-border fc-border-border fc-bg-background fc-p-4 fc-text-center fc-text-sm fc-font-medium fc-text-muted-foreground"
          htmlFor="image"
        >
          Upload Image
        </label>
      )}

      <div className="fc-mt-2 fc-flex fc-gap-1">
        <button
          className={cn(buttonVariants({ className: "fc-gap-2" }))}
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

function UpdateLinkMenu({ editor }: { editor: Editor }): JSX.Element {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const onOpenChange = (v: boolean): void => {
    if (v) {
      editor.commands.extendMarkRange("link");

      const href = editor.getAttributes("link").href as string | undefined;
      const selection = editor.state.selection;
      const selected = editor.state.doc.textBetween(
        selection.from,
        selection.to
      );

      setName(selected);
      setValue(href ?? "");
    }

    setIsOpen(v);
  };

  const unset = (): void => {
    onOpenChange(false);

    editor.chain().focus().unsetMark("link").run();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (value.trim().length === 0) return;
    onOpenChange(false);
    const content = name.length > 0 ? name : value;

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
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogTrigger
        aria-label="Toggle Link"
        className={cn(toggleVariants())}
        disabled={!editor.can().setLink({ href: "" })}
        type="button"
      >
        <LinkIcon className="fc-h-4 fc-w-4" />
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle>Add Link</DialogTitle>
        <form className="fc-flex fc-flex-col fc-gap-1" onSubmit={onSubmit}>
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
          <div className="fc-mt-2 fc-flex fc-gap-1">
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
      </DialogContent>
    </Dialog>
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
