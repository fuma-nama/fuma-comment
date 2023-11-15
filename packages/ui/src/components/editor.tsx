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
import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface UseCommentEditorProps
  extends Omit<Partial<EditorOptions>, "content" | "extensions"> {
  defaultValue?: string;
  placeholder?: string;
  onSubmit?: (editor: Editor) => void;
}

export interface CommentEditorProps extends HTMLAttributes<HTMLDivElement> {
  editor: Editor | null;
  variant?: "primary" | "secondary";
}

export function useCommentEditor({
  defaultValue,
  placeholder = "Leave comment",
  onSubmit,
  ...props
}: UseCommentEditorProps): Editor | null {
  return useEditor({
    content: defaultValue
      ? {
          type: "doc",
          content: defaultValue.split("\n").map((paragraph) => ({
            type: "paragraph",
            content: [{ type: "text", text: paragraph }],
          })),
        }
      : undefined,
    extensions: [
      Document,
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Shift-Enter": () => {
              if (onSubmit) {
                onSubmit(this.editor as Editor);
                return true;
              }

              return false;
            },
          };
        },
      }),
    ],
    ...props,
  });
}

export function CommentEditor({
  className,
  variant = "primary",
  ...props
}: CommentEditorProps): JSX.Element {
  return (
    <EditorContent
      className={cn(
        variant === "primary" && "primary-editor",
        variant === "secondary" && "secondary-editor",
        className
      )}
      {...props}
    />
  );
}

export function getEditorContent(content: JSONContent): string {
  const s = [content.text ?? ""];

  for (const child of content.content ?? []) {
    s.push(getEditorContent(child));
    if (child.type === "paragraph") s.push("\n");
  }

  return s.join("").trim();
}
