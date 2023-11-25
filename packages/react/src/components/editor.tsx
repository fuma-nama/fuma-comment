import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import type { Editor, EditorOptions, JSONContent } from "@tiptap/react";
import { useEditor, Extension, EditorContent } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { History } from "@tiptap/extension-history";
import { Text } from "@tiptap/extension-text";
import { useRef, type HTMLAttributes, type RefObject } from "react";
import { cn } from "../utils/cn";

export interface UseCommentEditorProps
  extends Omit<Partial<EditorOptions>, "content" | "extensions"> {
  defaultValue?: string;
  placeholder?: string;
  onSubmit?: (editor: Editor) => void;
  onEscape?: (editor: Editor) => void;
  disabled?: boolean;
}

export interface CommentEditorProps extends HTMLAttributes<HTMLDivElement> {
  editor: Editor | null;
  variant?: "primary" | "secondary";
}

export function useCommentEditor({
  defaultValue,
  placeholder,
  onSubmit,
  onEscape,
  disabled = false,
  ...props
}: UseCommentEditorProps): RefObject<Editor | null> {
  const ref = useRef<Editor | null>(null);
  const editor = useEditor({
    content: defaultValue ? getContentFromText(defaultValue) : undefined,
    extensions: [
      Document,
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder, showOnlyWhenEditable: false }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Shift-Enter": () => {
              if (onSubmit) {
                onSubmit(this.editor as Editor);
              }

              return true;
            },
            Escape: () => {
              onEscape?.(this.editor as Editor);
              return true;
            },
          };
        },
      }),
    ],
    ...props,
  });

  ref.current = editor;
  if (editor && editor.isEditable !== !disabled) {
    editor.setEditable(!disabled);
  }

  return ref;
}

export function CommentEditor({
  className,
  variant = "primary",
  ...props
}: CommentEditorProps): JSX.Element {
  const editor = cn(
    variant === "primary" && "primary-editor",
    variant === "secondary" && "secondary-editor",
    className
  );

  if (!props.editor) {
    return (
      <div aria-disabled className={editor} {...props}>
        <div className="tiptap fc-text-sm fc-text-muted-foreground">
          {props.placeholder}
        </div>
      </div>
    );
  }

  return (
    <EditorContent
      aria-disabled={!props.editor.isEditable}
      className={editor}
      {...props}
    />
  );
}

export function getContentFromText(text: string): JSONContent {
  return {
    type: "doc",
    content: text.split("\n").map((paragraph) => ({
      type: "paragraph",
      content:
        paragraph.length === 0 ? [] : [{ type: "text", text: paragraph }],
    })),
  };
}

export function getEditorContent(content: JSONContent): string {
  const s = [content.text ?? ""];

  for (const child of content.content ?? []) {
    s.push(getEditorContent(child));
    if (child.type === "paragraph") s.push("\n");
  }

  return s.join("");
}
