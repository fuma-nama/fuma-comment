import useMutation from "swr/mutation";
import * as React from "react";
import { type Editor } from "@tiptap/react";
import { cn } from "./utils/cn";
import { fetcher } from "./utils/fetcher";
import {
  CommentEditor,
  getEditorContent,
  useCommentEditor,
} from "./components/editor";
import { buttonVariants } from "./components/button";
import { Spinner } from "./components/spinner";

export function CommentPost(): JSX.Element {
  const mutation = useMutation(
    "/api/comments",
    (key, { arg }: { arg: { content: string } }) =>
      fetcher(key, { method: "POST", body: JSON.stringify(arg) })
  );

  const submit = React.useCallback(
    (instance: Editor): boolean => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return false;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
          },
        }
      );

      return true;
    },
    [mutation]
  );

  const editor = useCommentEditor({ onSubmit: submit });

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
          <CommentEditor editor={editor} />
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
        buttonVariants({
          className: "fc-absolute fc-right-2 fc-bottom-2 fc-z-10",
          variant: "icon",
        })
      )}
      disabled={loading || editor.isEmpty}
      type="submit"
    >
      {loading ? (
        <Spinner />
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

export function CommentEdit({
  id,
  defaultContent,
  onOpenChange,
}: {
  id: number;
  defaultContent: string;
  onOpenChange: (v: boolean) => void;
}): JSX.Element {
  const mutation = useMutation(
    "/api/comments",
    (key, { arg }: { arg: { id: number; content: string } }) =>
      fetcher(`${key}/${arg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: arg.content }),
      }),
    {
      onSuccess: () => {
        onOpenChange(false);
      },
    }
  );

  const submit = React.useCallback(
    (instance: Editor): boolean => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return false;
      void mutation.trigger({ id, content });

      return true;
    },
    [id, mutation]
  );

  const editor = useCommentEditor({
    placeholder: "Edit Message",
    defaultValue: defaultContent,
    onSubmit: submit,
    autofocus: "all",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (editor === null) return;
    submit(editor);
    e.preventDefault();
  };

  const onCancel = (): void => {
    onOpenChange(false);
  };

  return (
    <form onSubmit={onSubmit}>
      <CommentEditor
        className="fc-border fc-border-border fc-bg-background fc-rounded-md"
        editor={editor}
        variant="secondary"
      />
      <div className="fc-flex fc-flex-row fc-gap-2 fc-mt-2">
        <button
          aria-label="Edit"
          className={cn(
            buttonVariants({ variant: "primary", className: "fc-gap-2" })
          )}
          disabled={mutation.isMutating || editor?.isEmpty}
          type="submit"
        >
          {mutation.isMutating ? (
            <Spinner />
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
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          )}
          Edit
        </button>
        <button
          className={cn(buttonVariants({ variant: "ghost" }))}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
