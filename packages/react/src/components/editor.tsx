import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
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
import { cn } from "../utils/cn";

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
          "fc-rounded-xl fc-border fc-border-border fc-bg-card fc-px-3 fc-py-1.5 fc-transition-colors hover:fc-bg-accent focus-visible:fc-bg-card",
        secondary:
          "fc-rounded-md fc-border fc-border-border fc-bg-background fc-p-1.5",
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
          HardBreak,
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
      />
    );
  }
);

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
