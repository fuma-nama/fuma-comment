import type { Editor } from "@tiptap/react";
import { useCallback, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import { useAuthContext } from "../contexts/auth";
import { cn } from "../utils/cn";
import { type FetcherError, fetcher, getCommentsKey } from "../utils/fetcher";
import { onCommentPosted } from "../utils/comment-manager";
import { useCommentsContext } from "../contexts/comments";
import { buttonVariants } from "./button";
import {
  getEditorContent,
  useCommentEditor,
  CommentEditor,
  type UseCommentEditorProps,
} from "./editor";
import { Spinner } from "./spinner";

interface CommentPostProps extends Omit<UseCommentEditorProps, "onSubmit"> {
  thread?: number;
  className?: string;
  onSent?: () => void;
}

export function CommentPost({
  thread,
  placeholder = "Leave comment",
  className,
  onSent,
  ...props
}: CommentPostProps): JSX.Element {
  const auth = useAuthContext();
  const { page } = useCommentsContext();
  const mutation = useSWRMutation(
    getCommentsKey(thread, page),
    (key, { arg }: { arg: { content: string } }) =>
      fetcher(key[0], {
        method: "POST",
        body: JSON.stringify({
          thread: key[1],
          page: key[2],
          ...arg,
        }),
      })
  );

  const submit = useCallback(
    (instance: Editor) => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
            onCommentPosted(thread);
            onSent?.();
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Mutation objects shouldn't be included
    [thread]
  );

  const editor = useCommentEditor({ placeholder, onSubmit: submit, ...props });
  const disabled = mutation.isMutating;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (editor === null) return;
    submit(editor);
    e.preventDefault();
  };

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <form className={className} onSubmit={onSubmit}>
      {auth.status === "authenticated" && editor ? (
        <div className="fc-relative">
          <CommentEditor aria-disabled={disabled} editor={editor} />
          <button
            aria-label="Send Comment"
            className={cn(
              buttonVariants({
                className: "fc-absolute fc-right-2 fc-bottom-1.5",
                size: "icon",
              })
            )}
            disabled={mutation.isMutating || editor.isEmpty}
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
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <Placeholder>{placeholder}</Placeholder>
      )}
      {mutation.error ? (
        <p className="fc-text-sm fc-text-error fc-mt-1">
          {(mutation.error as FetcherError).message}
        </p>
      ) : null}
    </form>
  );
}

function Placeholder({ children }: { children: string }): JSX.Element {
  return (
    <div aria-disabled className="primary-editor">
      <div className="tiptap fc-text-sm fc-text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
