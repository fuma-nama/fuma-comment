import useMutation from "swr/mutation";
import * as React from "react";
import {
  EditorContent,
  type JSONContent,
  useEditor,
  type Editor,
  Extension,
} from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { History } from "@tiptap/extension-history";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { cn } from "./utils/cn";
import { fetcher } from "./utils/fetcher";

export function CommentEditor(): JSX.Element {
  const mutation = useMutation(
    "/api/comments",
    (key, { arg }: { arg: { content: string } }) =>
      fetcher(key, { method: "POST", body: JSON.stringify(arg) })
  );

  const editor = useEditor({
    extensions: [
      Document,
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder: "Leave comment" }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Shift-Enter": () => {
              submit(this.editor as Editor);
              return true;
            },
          };
        },
      }),
    ],
  });

  const submit = React.useCallback(
    (instance: Editor): void => {
      const content = flatten(instance.getJSON());

      if (content.length === 0) return;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
          },
        }
      );
    },
    [mutation]
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (editor === null) return;
    submit(editor);
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!mutation.isMutating);
  }, [editor, mutation.isMutating]);

  return (
    <form
      className="fc-relative fc-flex fc-flex-col fc-rounded-xl fc-border fc-border-border fc-bg-card"
      onSubmit={onSubmit}
    >
      {editor ? (
        <>
          <SendButton editor={editor} loading={mutation.isMutating} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div className="fc-min-h-[40px] fc-text-sm fc-px-3 fc-py-1.5 fc-text-muted-foreground">
          Leave comment
        </div>
      )}
    </form>
  );
}

function SendButton({
  editor,
  loading,
}: {
  editor: Editor;
  loading: boolean;
}): JSX.Element {
  return (
    <button
      aria-label="Send Comment"
      className={cn(
        "fc-absolute fc-p-1.5 fc-right-2 fc-bottom-2 fc-bg-primary fc-text-primary-foreground fc-transition-colors fc-rounded-full fc-z-10 hover:fc-bg-primary/80",
        (loading || editor.isEmpty) && "fc-text-muted-foreground fc-bg-muted"
      )}
      disabled={loading}
      type="submit"
    >
      {loading ? (
        <div className="fc-w-4 fc-h-4 fc-rounded-full fc-border-2 fc-border-border">
          <div className="fc-w-full fc-h-full fc-rounded-full fc-border-l-2 fc-border-primary fc-animate-spin" />
        </div>
      ) : (
        <svg
          className="fc-w-4 fc-h-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )}
    </button>
  );
}

function flatten(content: JSONContent): string {
  const s = [content.text ?? ""];

  for (const child of content.content ?? []) {
    s.push(flatten(child));
    if (child.type === "paragraph") s.push("\n");
  }

  return s.join("").trim();
}
