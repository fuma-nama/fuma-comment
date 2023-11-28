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
import { useRef, forwardRef, useState, useCallback, useEffect } from "react";
import { cva } from "cva";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
} from "lucide-react";
import { Link } from "@tiptap/extension-link";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";
import { inputVariants } from "./input";
import { Dialog } from "./dialog";

export interface UseCommentEditor {
  editor: Editor;
  isEmpty: boolean;
  getValue: () => string;
  clearValue: () => void;
}

export interface EditorProps {
  variant?: "primary" | "secondary";
  autofocus?: "start" | "end" | "all" | number | boolean;
  defaultValue?: string;
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
  "fc-min-h-[40px] fc-text-sm focus-visible:fc-outline-none focus-visible:fc-ring-2 focus-visible:fc-ring-ring",
  {
    variants: {
      variant: {
        primary:
          "fc-rounded-xl fc-border fc-border-border fc-bg-card fc-px-3 fc-py-1.5 fc-pr-10 fc-transition-colors hover:fc-bg-accent focus-visible:fc-bg-card",
        secondary:
          "fc-rounded-md fc-border fc-border-border fc-bg-background fc-p-1.5",
      },
    },
  }
);

const toggleVariants = cva(
  "fc-inline-flex fc-rounded-md fc-p-1 disabled:fc-cursor-not-allowed disabled:fc-opacity-50",
  {
    variants: {
      active: {
        true: "fc-bg-accent fc-text-accent-foreground",
        false: "fc-text-muted-foreground",
      },
    },
  }
);

/**
 * Always call the latest rendered callback
 *
 * For instance, you added a `onClick` listener to button. When the listener is re-constructed in the next render, the new listener will called instead
 */
function useLatestCallback<T extends (...args: unknown[]) => unknown>(
  latest: T
): T {
  const ref = useRef<T>(latest);
  ref.current = latest;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- Wrapped with refs
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

export const CommentEditor = forwardRef<HTMLDivElement, EditorProps>(
  (
    {
      editor,
      variant = "primary",
      defaultValue,
      disabled = false,
      placeholder,
      autofocus,
      editorProps,
      onChange,
      ...props
    },
    ref
  ) => {
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
        content: defaultValue ? getContentFromText(defaultValue) : undefined,
        editorProps: {
          attributes: {
            class: cn(editorVariants({ variant })),
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
              class:
                "fc-bg-muted fc-border fc-border-border fc-rounded-sm fc-p-0.5 fc-m-0.5",
            },
          }),
          Link.extend({ inclusive: false }).configure({
            openOnClick: false,
            HTMLAttributes: {
              class: "fc-font-medium fc-underline",
            },
          }),
          Italic,
          History,
          Paragraph,
          Text,
          Placeholder.configure({
            placeholder,
            showOnlyWhenEditable: false,
          }),
          Extension.create({
            addKeyboardShortcuts() {
              return {
                "Shift-Enter": onSubmit,
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
    }, [
      autofocus,
      defaultValue,
      onChange,
      onEscape,
      onSubmit,
      placeholder,
      variant,
    ]);

    const className = cn(
      "aria-disabled:fc-cursor-not-allowed aria-disabled:fc-opacity-80",
      editorProps?.className
    );

    if (!innerEditor) {
      return (
        <div aria-disabled ref={ref} {...editorProps} className={className}>
          <div className={cn(editorVariants({ variant, className: "tiptap" }))}>
            <p className="is-editor-empty" data-placeholder={placeholder} />
          </div>
        </div>
      );
    }

    innerEditor.setEditable(!disabled);

    return (
      <EditorContent
        aria-disabled={disabled}
        editor={innerEditor}
        ref={ref}
        {...editorProps}
        className={className}
      >
        <div className="fc-mb-1 fc-flex fc-flex-row fc-gap-0.5">
          <button
            aria-label="Toggle Bold"
            className={cn(
              toggleVariants({
                active: innerEditor.isActive("bold"),
              })
            )}
            disabled={!innerEditor.can().toggleBold()}
            onClick={() => innerEditor.chain().focus().toggleBold().run()}
            type="button"
          >
            <BoldIcon className="fc-h-4 fc-w-4" />
          </button>
          <button
            aria-label="Toggle Strike"
            className={cn(
              toggleVariants({
                active: innerEditor.isActive("strike"),
              })
            )}
            disabled={!innerEditor.can().toggleStrike()}
            onClick={() => innerEditor.chain().focus().toggleStrike().run()}
            type="button"
          >
            <StrikethroughIcon className="fc-h-4 fc-w-4" />
          </button>
          <button
            aria-label="Toggle Italic"
            className={cn(
              toggleVariants({
                active: innerEditor.isActive("italic"),
              })
            )}
            disabled={!innerEditor.can().toggleItalic()}
            onClick={() => innerEditor.chain().focus().toggleItalic().run()}
            type="button"
          >
            <ItalicIcon className="fc-h-4 fc-w-4" />
          </button>
          <button
            aria-label="Toggle Code"
            className={cn(
              toggleVariants({
                active: innerEditor.isActive("code"),
              })
            )}
            disabled={!innerEditor.can().toggleCode()}
            onClick={() => innerEditor.chain().focus().toggleCode().run()}
            type="button"
          >
            <CodeIcon className="fc-h-4 fc-w-4" />
          </button>
          <UpdateLinkMenu editor={innerEditor} />
        </div>
      </EditorContent>
    );
  }
);

function UpdateLinkMenu({ editor }: { editor: Editor }): JSX.Element {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = (): void => {
    setIsOpen(false);
  };

  const openModal = (): void => {
    editor.commands.extendMarkRange("link");

    const href = editor.getAttributes("link").href as string | undefined;
    const selection = editor.state.selection;
    const selected = editor.state.doc.textBetween(selection.from, selection.to);

    setName(selected);
    setValue(href ?? "");
    setIsOpen(true);
  };

  const set = (): void => {
    if (value.trim().length === 0) return;
    closeModal();
    const content = name.length > 0 ? name : value;

    if (!editor.state.selection.empty) {
      editor
        .chain()
        .extendMarkRange("link")
        .deleteSelection()
        .setLink({ href: value })
        .insertContent(content)
        .run();
    } else {
      editor
        .chain()
        .setLink({ href: value })
        .insertContent(content)
        .unsetMark("link")
        .insertContent(" ")
        .run();
    }
  };

  const unset = (): void => {
    closeModal();

    editor.commands.unsetMark("link");
  };

  return (
    <>
      <button
        aria-label="Toggle Link"
        className={cn(
          toggleVariants({
            active: editor.isActive("link"),
          })
        )}
        onClick={openModal}
        type="button"
      >
        <LinkIcon className="fc-h-4 fc-w-4" />
      </button>
      <Dialog isOpen={isOpen} onClose={closeModal}>
        <form
          className="fc-flex fc-flex-col"
          onSubmit={(e) => {
            set();
            e.preventDefault();
            e.stopPropagation();
          }}
        >
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
      </Dialog>
    </>
  );
}

CommentEditor.displayName = "Editor";

function createCommentEditor(editor: Editor): UseCommentEditor {
  return {
    editor,
    isEmpty: editor.isEmpty,
    getValue() {
      return getEditorContent(editor.getJSON());
    },
    clearValue() {
      editor.commands.clearContent(true);
    },
  };
}

function getContentFromText(text: string): JSONContent {
  return {
    type: "doc",
    content: text.split("\n").map((paragraph) => ({
      type: "paragraph",
      content:
        paragraph.length === 0 ? [] : [{ type: "text", text: paragraph }],
    })),
  };
}

function getEditorContent(content: JSONContent): string {
  const s = [content.text ?? ""];

  for (const child of content.content ?? []) {
    s.push(getEditorContent(child));
    if (child.type === "paragraph") s.push("\n");
  }

  return s.join("");
}
