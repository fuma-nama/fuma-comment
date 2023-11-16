import type { Editor } from "@tiptap/react";
import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import { cn } from "../utils/cn";
import { fetcher, getCommentsKey } from "../utils/fetcher";
import { useCommentContext } from "../contexts/comment";
import { updateComment } from "../utils/comment-manager";
import { buttonVariants } from "./button";
import { getEditorContent, useCommentEditor, CommentEditor } from "./editor";
import { Spinner } from "./spinner";

export function CommentEdit(): JSX.Element {
  const { comment, setEdit } = useCommentContext();

  const mutation = useSWRMutation(
    getCommentsKey(comment.replyCommentId),
    ([key], { arg }: { arg: { id: number; content: string } }) =>
      fetcher(`${key}/${arg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: arg.content }),
      })
  );

  const submit = useCallback(
    (instance: Editor): void => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return;
      void mutation.trigger(
        { id: comment.id, content },
        {
          revalidate: false,
          onSuccess: () => {
            updateComment(comment.id, (c) => ({ ...c, content }));
            setEdit(false);
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation objects shouldn't be included
    [comment.id]
  );

  const editor = useCommentEditor({
    placeholder: "Edit Message",
    defaultValue: comment.content,
    onSubmit: submit,
    autofocus: "all",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (editor === null) return;
    submit(editor);
    e.preventDefault();
  };

  const onCancel = (): void => {
    setEdit(false);
  };

  return (
    <form onSubmit={onSubmit}>
      <CommentEditor
        className="fc-border fc-border-border fc-bg-background fc-rounded-md"
        editor={editor}
        variant="secondary"
      />
      <div className="fc-flex fc-flex-row fc-gap-1 fc-mt-2">
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
